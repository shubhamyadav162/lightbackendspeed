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
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all gateways
    const { data: gateways, error } = await supabase
      .from('payment_gateways')
      .select('*')
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
 *   monthly_limit?: number,
 *   priority?: number,
 *   is_active?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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