import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/audit-logs
 *
 * Query params:
 *   - limit?: number (default 50, max 200)
 *   - cursor?: string (UUID of the last fetched id for keyset pagination)
 *   - processed?: 'true' | 'false' (filter on processed flag)
 *   - action?: comma-separated action filters e.g. INSERT,UPDATE
 *
 * Returns audit log rows ordered by created_at desc.
 */
export async function GET(request: NextRequest) {
  const authContext = await getAuthContext(request);
  if (!authContext || authContext.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseService();
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 