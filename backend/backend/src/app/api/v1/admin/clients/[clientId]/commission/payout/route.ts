import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

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