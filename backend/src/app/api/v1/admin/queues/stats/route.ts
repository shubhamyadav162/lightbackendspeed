import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = supabaseService;

/**
 * GET /api/v1/admin/queues/stats
 * Returns hourly aggregated metrics from materialized view `vw_queue_metrics_hourly`.
 */
export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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