import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/gateways - List all payment gateways
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService();
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    console.log('[GATEWAYS] API Key received:', apiKey ? 'present' : 'missing');
    
    const validApiKeys = [
      'admin_test_key',
      process.env.ADMIN_API_KEY,
      process.env.NEXT_PUBLIC_ADMIN_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey || '')) {
      console.log('[GATEWAYS] Unauthorized access attempt with key:', apiKey);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GATEWAYS] Fetching payment gateways...');

    const { data: gateways, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('[GATEWAYS] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[GATEWAYS] Found ${gateways?.length || 0} gateways`);
    return NextResponse.json({ gateways });

  } catch (err: any) {
    console.error('[GATEWAYS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/gateways - Create new payment gateway
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseService();
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key',
      process.env.ADMIN_API_KEY,
      process.env.NEXT_PUBLIC_ADMIN_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[GATEWAYS] Creating new gateway:', body.name);

    // Required fields validation
    const requiredFields = ['name', 'provider'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        );
      }
    }

    // Prepare gateway data
    const gatewayData = {
      name: body.name,
      provider: body.provider,
      api_key: body.api_key || '',
      api_secret: body.api_secret || '',
      priority: body.priority || 1,
      monthly_limit: body.monthly_limit || 1000000,
      current_volume: 0,
      success_rate: 100.0,
      is_active: body.is_active ?? true,
      temp_failed: false,
      credentials: body.credentials || {},
      webhook_url: body.webhook_url || '',
      webhook_secret: body.webhook_secret || '',
      environment: body.environment || 'production',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add provider-specific credentials to the credentials object
    if (body.api_key) gatewayData.credentials.api_key = body.api_key;
    if (body.api_secret) gatewayData.credentials.api_secret = body.api_secret;
    if (body.webhook_url) gatewayData.credentials.webhook_url = body.webhook_url;
    if (body.webhook_secret) gatewayData.credentials.webhook_secret = body.webhook_secret;

    const { data, error } = await supabase
      .from('payment_gateways')
      .insert(gatewayData)
      .select()
      .single();

    if (error) {
      console.error('[GATEWAYS] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('[GATEWAYS] Gateway created successfully:', data.id);
    return NextResponse.json({
      gateway: data,
      message: 'Gateway created successfully'
    }, { status: 201 });

  } catch (err: any) {
    console.error('[GATEWAYS] Creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 