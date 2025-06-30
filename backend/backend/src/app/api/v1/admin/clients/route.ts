import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

// GET /api/v1/admin/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let query = supabaseService
      .from('clients')
      .select(`
        id,
        client_key,
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
          warn_threshold
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,client_key.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('[CLIENTS] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedClients = clients?.map(client => ({
      id: client.id,
      name: client.company_name,
      company: client.company_name,
      email: `${client.client_key}@lightspeed.com`, // Mock email
      phone: '+1-555-0123', // Mock phone
      status: client.status,
      apiKey: client.client_key,
      totalTransactions: Math.floor(Math.random() * 10000), // Mock data
      totalVolume: Math.floor(Math.random() * 5000000), // Mock data
      lastActivity: new Date().toISOString().split('T')[0],
      whatsappNotifications: true,
      emailNotifications: true,
      monthlyLimit: 1000000,
      currentMonthVolume: Math.floor(Math.random() * 800000),
      client_key: client.client_key,
      webhook_url: client.webhook_url,
      fee_percent: client.fee_percent,
      balance_due: client.commission_wallets?.[0]?.balance_due || 0,
      warn_threshold: client.commission_wallets?.[0]?.warn_threshold || 10000,
      commission_earned: Math.floor(Math.random() * 100000), // Mock data
      last_payout: '2024-05-25',
      last_payout_amount: Math.floor(Math.random() * 50000),
      created_at: client.created_at,
      updated_at: client.updated_at
    })) || [];

    return NextResponse.json({
      clients: transformedClients,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (err: any) {
    console.error('[CLIENTS] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/v1/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_name, webhook_url, fee_percent = 3.5, suspend_threshold = 10000 } = body;

    if (!company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Generate unique client key and salt
    const client_key = `sk_live_${randomBytes(16).toString('hex')}`;
    const client_salt = `salt_${randomBytes(24).toString('hex')}`;

    // Create client
    const { data: client, error: clientError } = await supabaseService
      .from('clients')
      .insert({
        client_key,
        client_salt,
        company_name,
        webhook_url,
        fee_percent,
        suspend_threshold,
        status: 'active'
      })
      .select()
      .single();

    if (clientError) {
      console.error('[CLIENTS] Error creating client:', clientError);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    // Create commission wallet for the client
    const { error: walletError } = await supabaseService
      .from('commission_wallets')
      .insert({
        client_id: client.id,
        balance_due: 0,
        warn_threshold: 10000
      });

    if (walletError) {
      console.error('[CLIENTS] Error creating wallet:', walletError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.company_name,
        company: client.company_name,
        client_key: client.client_key,
        client_salt: client.client_salt,
        webhook_url: `https://api.lightspeedpay.com/webhook/${client.client_key}`,
        status: client.status,
        created_at: client.created_at
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error('[CLIENTS] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 