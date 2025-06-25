import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/server';

// Singleton service-role client
const supabase = supabaseService;

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
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit'));
    const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 200);
    const cursor = searchParams.get('cursor');
    const processedParam = searchParams.get('processed');
    const processed = processedParam === null ? undefined : processedParam === 'true';
    const actionParam = searchParams.get('action');
    const actions = actionParam ? actionParam.split(',').map((a) => a.trim()) : undefined;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      // Keyset pagination – fetch rows before the cursor created_at timestamp
      const { data: cursorRow, error: cursorErr } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorErr) {
        return NextResponse.json({ error: cursorErr.message }, { status: 400 });
      }
      if (cursorRow) {
        query = query.lt('created_at', cursorRow.created_at);
      }
    }

    if (processed !== undefined) {
      query = query.eq('processed', processed);
    }
    if (actions && actions.length) {
      query = query.in('action', actions);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ logs: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 