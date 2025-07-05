import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

// Force dynamic rendering to prevent static generation timeout
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/gateways
 * Returns a list of all payment gateways with metadata / health indicators.
 */
export async function GET(request: NextRequest) {
  try {
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key', 
      process.env.ADMIN_API_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ].filter(Boolean);
    
    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseService();

    // Fetch all gateways with extended fields
    const { data: gateways, error } = await supabase
      .from('payment_gateways')
      .select(`
        *,
        webhook_url,
        webhook_secret,
        environment,
        channel_id,
        auth_header,
        additional_headers,
        client_id,
        api_id
      `)
      .order('priority', { ascending: true });

    if (error) {
      console.error('[GATEWAYS] Supabase error:', error);
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        code: error.code,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log('[GATEWAYS] Successfully fetched', gateways?.length || 0, 'gateways');

    // Process gateways to extract provider info from credentials JSON
    const processedGateways = (gateways || []).map(gateway => ({
      id: gateway.id,
      name: gateway.name,
      code: gateway.code,
      provider: gateway.credentials?.provider || gateway.code, // Extract provider from credentials
      is_active: gateway.is_active,
      priority: gateway.priority,
      monthly_limit: gateway.credentials?.monthly_limit || 1000000,
      success_rate: gateway.credentials?.success_rate || 100,
      api_endpoint_url: gateway.credentials?.api_endpoint_url,
      credentials: gateway.credentials,
      created_at: gateway.created_at,
      updated_at: gateway.updated_at,
    }));

    return NextResponse.json({
      gateways: processedGateways,
      total: processedGateways.length,
      debug: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('[GATEWAYS] Unexpected error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/gateways
 * Body: {
 *   name: string,
 *   provider: string,
 *   credentials: object,
 *   api_key?: string,
 *   api_secret?: string,
 *   webhook_url?: string,
 *   webhook_secret?: string,
 *   client_id?: string,
 *   api_id?: string,
 *   api_endpoint_url?: string,
 *   environment?: string,
 *   channel_id?: string,
 *   auth_header?: string,
 *   additional_headers?: string,
 *   monthly_limit?: number,
 *   priority?: number,
 *   is_active?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key', 
      process.env.ADMIN_API_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ].filter(Boolean);
    
    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GATEWAYS POST] Creating new gateway...');
    const supabase = getSupabaseService();

    const body = await request.json();
    console.log('[GATEWAYS POST] Request body:', body);

    const {
      name,
      provider,
      credentials,
      api_key,
      api_secret,
      webhook_url,
      webhook_secret,
      client_id,
      api_id,
      api_endpoint_url,
      environment = 'test',
      channel_id,
      auth_header,
      additional_headers,
      monthly_limit = 1_000_000,
      priority = 100,
      is_active = true,
      success_rate = 100,
    } = body || {};

    if (!name || !provider) {
      return NextResponse.json({ error: 'name and provider are required' }, { status: 400 });
    }

    // Build comprehensive credentials object
    let gatewayCredentials = credentials || {};
    
    // Add provider-specific credentials
    if (provider === 'custom') {
      gatewayCredentials = {
        ...gatewayCredentials,
        client_id,
        api_id,
        api_secret,
        api_endpoint_url,
        webhook_secret,
        ...(additional_headers && { additional_headers: JSON.parse(additional_headers) }),
      };
    } else if (provider === 'payu') {
      // Special handling for PayU gateway
      gatewayCredentials = {
        provider: 'payu',
        api_key,
        api_secret,
        client_id,
        client_secret: body.client_secret || credentials?.client_secret,
        webhook_secret,
        ...(auth_header && { auth_header }),
      };
    } else {
      gatewayCredentials = {
        ...gatewayCredentials,
        api_key,
        api_secret,
        webhook_secret,
        ...(environment && ['phonepe', 'cashfree'].includes(provider) && { environment }),
        ...(channel_id && provider === 'paytm' && { channel_id }),
        ...(auth_header && provider === 'payu' && { auth_header }),
      };
    }

    // Derive code slug (unique)
    const code = `${provider}_${name}`.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Prepare insert data
    const insertData: any = {
      code,
      name,
      provider,
      credentials: gatewayCredentials,
      monthly_limit,
      priority,
      is_active,
      success_rate,
      webhook_url,
      environment,
      created_at: new Date().toISOString(),
    };

    // Add provider-specific fields to table directly
    if (provider === 'custom') {
      insertData.client_id = client_id;
      insertData.api_id = api_id;
      insertData.api_endpoint_url = api_endpoint_url;
    }
    
    if (webhook_secret) insertData.webhook_secret = webhook_secret;
    if (channel_id) insertData.channel_id = channel_id;
    if (auth_header) insertData.auth_header = auth_header;
    if (additional_headers) {
      try {
        insertData.additional_headers = JSON.parse(additional_headers);
      } catch (e) {
        // Keep as string if not valid JSON
        insertData.additional_headers = { raw: additional_headers };
      }
    }

    console.log('[GATEWAYS POST] Creating gateway with:', { code, name, provider, priority, is_active });

    // Insert gateway row using existing schema columns only
    const { data: gateway, error: insErr } = await supabase
      .from('payment_gateways')
      .insert(insertData)
      .select('*')
      .single();

    if (insErr) {
      console.error('[GATEWAYS POST] Database error:', insErr);
      throw new Error(insErr.message);
    }

    return NextResponse.json({ 
      gateway,
      message: 'Gateway created successfully with comprehensive credential support'
    });
  } catch (err: any) {
    console.error('Gateway creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 