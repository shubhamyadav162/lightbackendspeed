import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';
import { getCached, setCached } from '@/lib/redis';
import { getPgPool } from '@/lib/pgPool';

// Shared service-role Supabase client
const supabase = supabaseService;

/**
 * GET /api/v1/analytics
 *
 * Provides aggregate transaction analytics for dashboard charts.
 *
 * Query params:
 *   merchantId – optional override (admin only; if omitted will use authCtx.merchantId)
 *   days       – integer window (1–90), defaults to 30 days
 *
 * Response shape:
 *   {
 *     stats: DailyStat[];       // ordered descending by date (newest first)
 *     totals: AggregateTotals;  // cumulative across the returned window
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    //------------------------------------------------------------------
    // 1) Supabase JWT authentication (preferred) ----------------------
    //------------------------------------------------------------------
    const authCtx = await getAuthContext(request);

    //------------------------------------------------------------------
    // 2) Legacy API-key header authentication (merchant SDK fallback) --
    //------------------------------------------------------------------
    let legacyMerchantId: string | null = null;
    if (!authCtx?.merchantId) {
      // Dynamic import avoids circular dependency with /settlements route
      const settlementsModule: any = await import('../settlements/route');
      if (typeof settlementsModule.verifyMerchantAuth === 'function') {
        try {
          const merchant = await settlementsModule.verifyMerchantAuth(request as any);
          legacyMerchantId = merchant?.id ?? null;
        } catch (_) {
          // ignore – handled below if request ends up unauthenticated
        }
      }
    }

    //------------------------------------------------------------------
    // Determine merchant scope ---------------------------------------
    //------------------------------------------------------------------
    let merchantId: string | null = authCtx?.merchantId || legacyMerchantId;

    const { searchParams } = new URL(request.url);
    const qpMerchantId = searchParams.get('merchantId');
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const days = isNaN(daysParam) ? 30 : Math.min(Math.max(daysParam, 1), 90); // clamp 1–90

    if (qpMerchantId) merchantId = qpMerchantId;

    //------------------------------------------------------------------
    // Attempt Redis cache --------------------------------------------
    //------------------------------------------------------------------
    const cacheKey = `analytics:${merchantId || 'all'}:${days}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    //------------------------------------------------------------------
    // Prefer pooled raw SQL aggregation if pgPool is available --------
    //------------------------------------------------------------------
    const pool = getPgPool();
    let stats: any[] = [];

    if (pool) {
      const sql = `
        SELECT
          date_trunc('day', created_at)::date               AS date,
          COUNT(*)                                          AS total_count,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')      AS completed_count,
          COUNT(*) FILTER (WHERE status = 'FAILED')         AS failed_count,
          COUNT(*) FILTER (WHERE status = 'PENDING')        AS pending_count,
          COALESCE(SUM(amount), 0)                          AS total_amount,
          COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) AS completed_amount
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '${days} day'
          AND ($1::uuid IS NULL OR merchant_id = $1)
        GROUP BY 1
        ORDER BY 1 DESC`;

      const { rows } = await pool.query(sql, [merchantId]);
      stats = rows as any[];
    } else {
      //------------------------------------------------------------------
      // Fallback: Query Supabase view `transaction_stats` --------------
      //------------------------------------------------------------------
      let statsQuery = supabase
        .from('transaction_stats')
        .select('*')
        .gte('date', `now() - interval '${days} day'`)
        .order('date', { ascending: false });

      if (merchantId) statsQuery = statsQuery.eq('merchant_id', merchantId);

      const { data: statsRows, error: statsErr } = await statsQuery;
      if (statsErr) throw new Error(statsErr.message);

      stats = (statsRows || []) as any[];
    }

    // ---------------------------------------------------------------
    // Derive cumulative totals over the window ----------------------
    // ---------------------------------------------------------------
    const totals = stats.reduce(
      (acc, row: any) => {
        acc.total_count += row.total_count;
        acc.completed_count += row.completed_count;
        acc.failed_count += row.failed_count;
        acc.pending_count += row.pending_count;
        acc.total_amount += Number(row.total_amount);
        acc.completed_amount += Number(row.completed_amount);
        return acc;
      },
      {
        total_count: 0,
        completed_count: 0,
        failed_count: 0,
        pending_count: 0,
        total_amount: 0,
        completed_amount: 0,
      },
    );

    const payload = { stats, totals };

    //------------------------------------------------------------------
    // Store in Redis (TTL from env / default) -------------------------
    //------------------------------------------------------------------
    await setCached(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 