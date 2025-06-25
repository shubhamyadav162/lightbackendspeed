// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/server';

/**
 * POST /api/v1/admin/gateways/:id/test
 * Performs a lightweight connectivity test to the payment gateway.
 * For now, stub implementation returning random success.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Lookup gateway API endpoint
    const { data: gateway, error: gwErr } = await supabaseService
      .from('payment_gateways')
      .select('id, api_endpoint')
      .eq('id', id)
      .single();

    if (gwErr || !gateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    // Perform ping to /ping endpoint exposed by gateway adapter service
    let success = false;
    let latency_ms = null;
    const start = Date.now();
    try {
      const resp = await fetch(`${gateway.api_endpoint}/ping`, {
        method: 'GET',
        // 5-second timeout (edge runtime lacks AbortController inside fetch options, so rely on default but measure time anyway)
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      latency_ms = Date.now() - start;
      success = resp.ok;
    } catch (_) {
      latency_ms = Date.now() - start;
      success = false;
    }

    // Record test result
    const { error: insertErr } = await supabaseService
      .from('gateway_test_results')
      .insert({ gateway_id: id, success, latency_ms });
    if (insertErr) console.error('failed to insert test result', insertErr);

    return NextResponse.json({ id, success, latency_ms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 