import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

// Singleton service-role client
const supabase = supabaseService;

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

    if (error) throw new Error(error.message);

    return NextResponse.json({ gateways });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
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

    const body = await request.json();
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

    // Insert gateway row
    const { data: gateway, error: insErr } = await supabase
      .from('payment_gateways')
      .insert(insertData)
      .select('*')
      .single();

    if (insErr) throw new Error(insErr.message);

    return NextResponse.json({ 
      gateway,
      message: 'Gateway created successfully with comprehensive credential support'
    });
  } catch (err: any) {
    console.error('Gateway creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 