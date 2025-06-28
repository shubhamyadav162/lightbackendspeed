import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/gateways
 * Returns a list of all payment gateways with metadata / health indicators.
 */
export async function GET(request: NextRequest) {
  try {
    // Check API key - allow admin_test_key in all environments for debugging
    const apiKey = request.headers.get('x-api-key');
    console.log('[GATEWAYS] API Key received:', apiKey ? 'present' : 'missing');
    console.log('[GATEWAYS] Environment:', process.env.NODE_ENV);
    
    if (apiKey !== 'admin_test_key') {
      console.log('[GATEWAYS] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug logging for environment variables
    console.log('[GATEWAYS] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET ✅' : 'MISSING ❌',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET ✅' : 'MISSING ❌'
    });

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[GATEWAYS] Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Configuration error - missing Supabase credentials',
        debug: {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
        }
      }, { status: 500 });
    }

    const supabase = getSupabaseService();
    console.log('[GATEWAYS] Supabase client initialized');

    const { data: gateways, error } = await supabase
      .from('payment_gateways')
      .select(`
        id,
        name,
        code,
        credentials,
        is_active,
        priority,
        created_at,
        updated_at
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
 *   monthly_limit?: number,
 *   priority?: number,
 *   is_active?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check API key for admin access
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      console.log('[GATEWAYS POST] Unauthorized access attempt');
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
      api_endpoint_url,
      monthly_limit = 1_000_000,
      priority = 100,
      is_active = true,
      success_rate = 100,
    } = body || {};

    if (!name || !provider || !credentials) {
      console.log('[GATEWAYS POST] Missing required fields:', { name, provider, credentials });
      return NextResponse.json({ 
        error: 'name, provider, credentials required',
        received: { name, provider, credentials: credentials ? 'present' : 'missing' }
      }, { status: 400 });
    }

    // Derive code slug (unique) from provider + name
    const code = `${provider}_${name}`.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    console.log('[GATEWAYS POST] Creating gateway with:', { code, name, provider, priority, is_active });

    // Enhance credentials object to include provider info and gateway details
    const enhancedCredentials = {
      ...credentials,
      provider: provider,
      monthly_limit: monthly_limit,
      success_rate: success_rate,
      ...(api_endpoint_url && { api_endpoint_url: api_endpoint_url }),
    };

    const insertPayload = {
      code,
      name,
      credentials: enhancedCredentials, // Store all additional info in credentials JSON
      priority,
      is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[GATEWAYS POST] Final insert payload:', insertPayload);

    // Insert gateway row using existing schema columns only
    const { data: gateway, error: insErr } = await supabase
      .from('payment_gateways')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insErr) {
      console.error('[GATEWAYS POST] Database error:', insErr);
      throw new Error(insErr.message);
    }

    console.log('[GATEWAYS POST] Gateway created successfully:', gateway);
    return NextResponse.json({ gateway });
    
  } catch (err: any) {
    console.error('[GATEWAYS POST] Error:', err);
    return NextResponse.json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 400 });
  }
} 