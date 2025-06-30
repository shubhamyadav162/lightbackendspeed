import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

// GET /api/v1/admin/clients/[clientId]/commission - Get commission details
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = params;

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get client with commission wallet
    const { data: client, error: clientError } = await supabaseService
      .from('clients')
      .select(`
        id,
        company_name,
        fee_percent,
        commission_wallets (
          id,
          balance_due,
          warn_threshold,
          wa_last_sent
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const wallet = client.commission_wallets?.[0];

    // Get commission entries for history
    const { data: commissionEntries, error: entriesError } = await supabaseService
      .from('commission_entries')
      .select(`
        id,
        amount,
        type,
        created_at,
        transaction_id,
        notes
      `)
      .eq('wallet_id', wallet?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate totals
    const totalCommissionEarned = commissionEntries?.reduce((sum, entry) => 
      entry.type === 'COMMISSION' ? sum + entry.amount : sum, 0) || 0;
    
    const totalPayouts = commissionEntries?.reduce((sum, entry) => 
      entry.type === 'COMMISSION_PAYOUT' ? sum + Math.abs(entry.amount) : sum, 0) || 0;

    const lastPayout = commissionEntries?.find(entry => entry.type === 'COMMISSION_PAYOUT');

    return NextResponse.json({
      commission: {
        fee_percent: client.fee_percent,
        balance_due: wallet?.balance_due || 0,
        warn_threshold: wallet?.warn_threshold || 10000,
        commission_earned: totalCommissionEarned,
        total_payouts: totalPayouts,
        last_payout: lastPayout ? {
          amount: Math.abs(lastPayout.amount),
          date: lastPayout.created_at?.split('T')[0]
        } : null,
        wa_last_sent: wallet?.wa_last_sent
      },
      history: commissionEntries?.map(entry => ({
        id: entry.id,
        amount: entry.amount,
        type: entry.type,
        transaction_id: entry.transaction_id,
        notes: entry.notes,
        created_at: entry.created_at?.replace('T', ' ').split('.')[0]
      })) || []
    });

  } catch (err: any) {
    console.error('[COMMISSION] Get error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/v1/admin/clients/[clientId]/commission - Update commission settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = params;
    const body = await request.json();
    const { fee_percent, warn_threshold } = body;

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Update client fee percentage if provided
    if (fee_percent !== undefined) {
      const { error: clientUpdateError } = await supabaseService
        .from('clients')
        .update({ 
          fee_percent,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientUpdateError) {
        console.error('[COMMISSION] Client update error:', clientUpdateError);
        return NextResponse.json({ error: 'Failed to update commission rate' }, { status: 500 });
      }
    }

    // Update wallet threshold if provided
    if (warn_threshold !== undefined) {
      const { error: walletUpdateError } = await supabaseService
        .from('commission_wallets')
        .update({ warn_threshold })
        .eq('client_id', clientId);

      if (walletUpdateError) {
        console.error('[COMMISSION] Wallet update error:', walletUpdateError);
        return NextResponse.json({ error: 'Failed to update warning threshold' }, { status: 500 });
      }
    }

    // Insert audit log
    await supabaseService
      .from('audit_logs')
      .insert({
        action: 'COMMISSION_UPDATED',
        details: {
          client_id: clientId,
          changes: {
            fee_percent,
            warn_threshold
          }
        },
        performed_by: 'admin'
      });

    return NextResponse.json({
      success: true,
      message: 'Commission settings updated successfully'
    });

  } catch (err: any) {
    console.error('[COMMISSION] Update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/v1/admin/clients/[clientId]/commission/payout - Process manual payout
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = params;
    const body = await request.json();
    const { amount } = body; // Amount in paisa

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseService
      .from('commission_wallets')
      .select('id, balance_due')
      .eq('client_id', clientId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Client wallet not found' }, { status: 404 });
    }

    const payoutAmount = amount || wallet.balance_due;

    if (payoutAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
    }

    if (payoutAmount > wallet.balance_due) {
      return NextResponse.json({ error: 'Payout amount exceeds balance due' }, { status: 400 });
    }

    // Process the payout using RPC function
    const { error: payoutError } = await supabaseService
      .rpc('process_commission_payout', {
        p_wallet_id: wallet.id,
        p_amount: payoutAmount
      });

    if (payoutError) {
      console.error('[COMMISSION PAYOUT] RPC error:', payoutError);
      return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
    }

    // Insert audit log
    await supabaseService
      .from('audit_logs')
      .insert({
        action: 'COMMISSION_PAYOUT_PROCESSED',
        details: {
          client_id: clientId,
          wallet_id: wallet.id,
          amount: payoutAmount,
          type: 'manual'
        },
        performed_by: 'admin'
      });

    return NextResponse.json({
      success: true,
      message: 'Payout processed successfully',
      payout: {
        amount: payoutAmount,
        new_balance: wallet.balance_due - payoutAmount,
        processed_at: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('[COMMISSION PAYOUT] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 