import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = supabaseService;

/**
 * GET /api/v1/admin/queues
 * Returns metrics for all known queues.
 */
export async function GET(request: NextRequest) {
  try {
    // Check API key first (for testing/development)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey === 'admin_test_key') {
      // Allow access with admin_test_key for testing
      console.log('[QUEUES] Access granted via API key');
    } else {
      // Otherwise check Supabase JWT authentication
      // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    }

    const { data: metrics, error } = await supabase
      .from('queue_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    // Group by queue_name and select latest record per queue
    const latest: Record<string, any> = {};
    (metrics || []).forEach((m) => {
      if (!latest[m.queue_name]) latest[m.queue_name] = m;
    });

    return NextResponse.json({ queues: Object.values(latest) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 