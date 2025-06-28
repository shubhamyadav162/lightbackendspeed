import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

// GET /api/v1/admin/clients/[clientId] - Get detailed client information
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

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get comprehensive client data
    const { data: client, error: clientError } = await supabaseService
      .from('clients')
      .select(`
        id,
        client_key,
        client_salt,
        company_name,
        webhook_url,
        fee_percent,
        suspend_threshold,
        status,
        created_at,
        updated_at,
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
      console.error('[CLIENT DETAILS] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client transactions (last 10)
    const { data: transactions, error: txnError } = await supabaseService
      .from('client_transactions')
      .select(`
        id,
        order_id,
        amount,
        status,
        gateway_txn_id,
        created_at,
        payment_gateways (
          name,
          code
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get commission entries (last 10)
    const { data: commissionEntries, error: commissionError } = await supabaseService
      .from('commission_entries')
      .select(`
        id,
        amount,
        type,
        created_at,
        transaction_id
      `)
      .eq('wallet_id', client.commission_wallets?.[0]?.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get WhatsApp notifications for this client
    const { data: notifications, error: notificationError } = await supabaseService
      .from('whatsapp_notifications')
      .select(`
        id,
        template,
        type,
        status,
        sent_at,
        error,
        created_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate revenue analytics
    const totalTransactions = transactions?.length || 0;
    const totalVolume = transactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
    const successfulTransactions = transactions?.filter(txn => txn.status === 'success').length || 0;
    const commissionEarned = commissionEntries?.reduce((sum, entry) => 
      entry.type === 'COMMISSION' ? sum + entry.amount : sum, 0) || 0;

    // Mock gateway data (in real implementation, this would come from actual gateway assignments)
    const mockGateways = [
      {
        id: 'gw1',
        name: 'Razorpay_Primary',
        provider: 'razorpay',
        priority: 1,
        status: 'active',
        success_rate: 98.5,
        monthly_volume: Math.floor(Math.random() * 200000),
        limit: 500000,
        response_time: 245
      },
      {
        id: 'gw2',
        name: 'PayU_Secondary',
        provider: 'payu',
        priority: 2,
        status: 'active',
        success_rate: 97.2,
        monthly_volume: Math.floor(Math.random() * 150000),
        limit: 400000,
        response_time: 312
      },
      {
        id: 'gw3',
        name: 'Cashfree_Backup',
        provider: 'cashfree',
        priority: 3,
        status: 'active',
        success_rate: 96.8,
        monthly_volume: Math.floor(Math.random() * 100000),
        limit: 300000,
        response_time: 287
      },
      {
        id: 'gw4',
        name: 'PhonePe_Express',
        provider: 'phonepe',
        priority: 4,
        status: 'inactive',
        success_rate: 95.1,
        monthly_volume: 0,
        limit: 200000,
        response_time: 356
      },
      {
        id: 'gw5',
        name: 'Paytm_Special',
        provider: 'paytm',
        priority: 5,
        status: 'active',
        success_rate: 94.7,
        monthly_volume: Math.floor(Math.random() * 80000),
        limit: 250000,
        response_time: 398
      }
    ];

    // Transform and return comprehensive client data
    const clientDetails = {
      id: client.id,
      name: client.company_name,
      company: client.company_name,
      email: `${client.client_key.substring(8, 16)}@lightspeed.com`,
      phone: '+1-555-0456',
      status: client.status,
      client_key: client.client_key,
      client_salt: client.client_salt,
      webhook_url: client.webhook_url || `https://api.lightspeedpay.com/webhook/${client.client_key}`,
      created_at: client.created_at?.split('T')[0],
      last_activity: new Date().toISOString().replace('T', ' ').split('.')[0],

      // Revenue & Commission Data
      revenue: {
        total_volume: totalVolume,
        total_transactions: totalTransactions,
        commission_earned: commissionEarned,
        commission_rate: client.fee_percent,
        monthly_volume: Math.floor(totalVolume * 0.3), // Mock monthly data
        monthly_transactions: Math.floor(totalTransactions * 0.3),
        success_rate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 100
      },

      // Wallet Data
      wallet: {
        balance_due: client.commission_wallets?.[0]?.balance_due || 0,
        warn_threshold: client.commission_wallets?.[0]?.warn_threshold || 10000,
        last_payout: '2024-05-25',
        last_payout_amount: 45000,
        auto_payout_enabled: true
      },

      // Gateway Allocation
      gateways: mockGateways,

      // Recent Transactions
      recent_transactions: transactions?.map(txn => ({
        id: txn.id,
        order_id: txn.order_id,
        amount: txn.amount,
        status: txn.status,
        gateway: (txn.payment_gateways as any)?.name || 'Unknown',
        gateway_txn_id: txn.gateway_txn_id,
        created_at: txn.created_at?.replace('T', ' ').split('.')[0]
      })) || [],

      // Commission History
      commission_history: commissionEntries?.map(entry => ({
        id: entry.id,
        amount: entry.amount,
        type: entry.type,
        transaction_id: entry.transaction_id,
        created_at: entry.created_at?.replace('T', ' ').split('.')[0]
      })) || [],

      // Notifications
      notifications: notifications?.map(notification => ({
        id: notification.id,
        template: notification.template,
        type: notification.type,
        status: notification.status,
        sent_at: notification.sent_at,
        error: notification.error,
        created_at: notification.created_at?.replace('T', ' ').split('.')[0]
      })) || []
    };

    return NextResponse.json({ client: clientDetails });

  } catch (err: any) {
    console.error('[CLIENT DETAILS] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/v1/admin/clients/[clientId] - Update client information
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

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const allowedFields = [
      'company_name',
      'webhook_url',
      'fee_percent',
      'suspend_threshold',
      'status'
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: client, error } = await supabaseService
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('[CLIENT UPDATE] Database error:', error);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ client });

  } catch (err: any) {
    console.error('[CLIENT UPDATE] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 