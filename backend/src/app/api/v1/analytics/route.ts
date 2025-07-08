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
 *   from       - ISO 8601 date string, start of the date range
 *   to         - ISO 8601 date string, end of the date range
 *   timezone   - IANA timezone string (e.g., 'Asia/Kolkata'), defaults to UTC
 *
 * If 'from' and 'to' are not provided, it defaults to the last 30 days.
 *
 * Response shape:
 *   {
 *     stats: DailyStat[];       // ordered descending by date (newest first)
 *     totals: AggregateTotals;  // cumulative across the returned window
 *   }
 */
export async function GET(request: NextRequest) {
  console.log('[Analytics API] Received request');
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
    
    // Date range and timezone handling
    const timezone = searchParams.get('timezone') || 'UTC';
    let from = searchParams.get('from');
    let to = searchParams.get('to');

    if (!from || !to) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      to = today.toISOString();
      from = thirtyDaysAgo.toISOString();
    }

    if (qpMerchantId) merchantId = qpMerchantId;

    // Validate dates
    if (isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format provided for "from" or "to". Please use ISO 8601 format.' 
      }, { status: 400 });
    }

    //------------------------------------------------------------------
    // Attempt Redis cache --------------------------------------------
    //------------------------------------------------------------------
    const cacheKey = `analytics:${merchantId || 'all'}:${from}:${to}:${timezone}`;
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
        WITH daily_series AS (
          SELECT generate_series(
            $2::timestamptz,
            $3::timestamptz,
            '1 day'::interval
          )::date AS date
        )
        SELECT
          d.date,
          COALESCE(t.total_count, 0)      AS total_count,
          COALESCE(t.completed_count, 0)  AS completed_count,
          COALESCE(t.failed_count, 0)     AS failed_count,
          COALESCE(t.pending_count, 0)    AS pending_count,
          COALESCE(t.total_amount, 0)     AS total_amount,
          COALESCE(t.completed_amount, 0) AS completed_amount
        FROM daily_series d
        LEFT JOIN (
          SELECT
            (created_at AT TIME ZONE 'UTC' AT TIME ZONE $4)::date AS date,
            COUNT(*)                                          AS total_count,
            COUNT(*) FILTER (WHERE status = 'COMPLETED')      AS completed_count,
            COUNT(*) FILTER (WHERE status = 'FAILED')         AS failed_count,
            COUNT(*) FILTER (WHERE status = 'PENDING')        AS pending_count,
            COALESCE(SUM(amount), 0)                          AS total_amount,
            COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) AS completed_amount
          FROM transactions
          WHERE created_at >= $2::timestamptz
            AND created_at < $3::timestamptz + interval '1 day'
            AND ($1::uuid IS NULL OR merchant_id = $1)
          GROUP BY 1
        ) t ON d.date = t.date
        ORDER BY d.date DESC`;

      const { rows } = await pool.query(sql, [merchantId, from, to, timezone]);
      stats = rows as any[];
    } else {
      //------------------------------------------------------------------
      // Fallback: Query Supabase view `transaction_stats` --------------
      //------------------------------------------------------------------
      console.warn('[Analytics API] pgPool not available, using Supabase fallback. This is less performant.');
      if (!supabase) throw new Error('Supabase client not initialized');
      
      let statsQuery = supabase
        .from('transaction_stats')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (merchantId) statsQuery = statsQuery.eq('merchant_id', merchantId);

      const { data: statsRows, error: statsErr } = await statsQuery;
      if (statsErr) {
        console.error('Error querying transaction_stats view:', statsErr);
        throw new Error(statsErr.message);
      }

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
    console.error('[Analytics API Error]', {
      message: err.message,
      stack: err.stack,
      error: err,
    });
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data.', 
      message: err.message 
    }, { status: 400 });
  }
} 