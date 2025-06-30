import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/gateways/health
 * Returns latest health status per gateway (is_online, latency_ms, last_checked)
 */
export async function GET(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Distinct-on style query to fetch latest metric for each gateway
    const { data, error } = await supabaseService.rpc('get_latest_gateway_health');

    if (error) {
      // Fallback to raw query if RPC not available (older migrations)
      const { data: fallbackData, error: rawErr } = await supabaseService
        .from('gateway_health_metrics')
        .select('gateway_id, is_online, latency_ms, checked_at')
        .order('gateway_id, checked_at', { ascending: false })
        .limit(1000); // fetch recent rows

      if (rawErr) throw new Error(rawErr.message);

      // Reduce to latest per gateway
      const latestMap = new Map<string, any>();
      (fallbackData || []).forEach((row: any) => {
        if (!latestMap.has(row.gateway_id)) latestMap.set(row.gateway_id, row);
      });

      return NextResponse.json({ metrics: Array.from(latestMap.values()) });
    }

    return NextResponse.json({ metrics: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 