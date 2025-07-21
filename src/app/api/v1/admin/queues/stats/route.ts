import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = getSupabaseService();

/**
 * GET /api/v1/admin/queues/stats
 * Returns hourly aggregated metrics from materialized view `vw_queue_metrics_hourly`.
 */
export async function GET(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
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