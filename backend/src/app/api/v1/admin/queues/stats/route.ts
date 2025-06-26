import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = supabaseService;

/**
 * GET /api/v1/admin/queues/stats
 * Returns hourly aggregated metrics from materialized view `vw_queue_metrics_hourly`.
 */
export async function GET(request: NextRequest) {
  try {
    // Check API key first (for testing/development)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey === 'admin_test_key') {
      // Allow access with admin_test_key for testing
      console.log('[QUEUE STATS] Access granted via API key');
    } else {
      // Otherwise check Supabase JWT authentication
      const authCtx = await getAuthContext(request);
      if (!authCtx || authCtx.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { data, error } = await supabase
      .from('vw_queue_metrics_hourly')
      .select('*')
      .order('hour_bucket', { ascending: false })
      .limit(168); // past week

    if (error) throw new Error(error.message);

    return NextResponse.json({ stats: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 