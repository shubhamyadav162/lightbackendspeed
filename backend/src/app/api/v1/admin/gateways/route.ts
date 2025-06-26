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
        type,
        is_active,
        priority,
        max_amount,
        min_amount,
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

    return NextResponse.json({
      gateways: gateways || [],
      total: gateways?.length || 0,
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
      const authCtx = await getAuthContext(request);
      if (!authCtx || authCtx.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = getSupabaseService();

    const body = await request.json();
    const {
      name,
      provider,
      credentials,
      monthly_limit = 1_000_000,
      priority = 100,
      is_active = true,
      success_rate = 100,
    } = body || {};

    if (!name || !provider || !credentials) {
      return NextResponse.json({ error: 'name, provider, credentials required' }, { status: 400 });
    }

    // Derive code slug (unique)
    const code = `${provider}_${name}`.toLowerCase().replace(/\s+/g, '_');

    // Insert gateway row  
    const { data: gateway, error: insErr } = await supabase
      .from('payment_gateways')
      .insert({
        code,
        name,
        provider,
        credentials,
        monthly_limit,
        priority,
        is_active,
        success_rate,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insErr) throw new Error(insErr.message);

    return NextResponse.json({ gateway });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 