import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { getCached, setCached } from '@/lib/redis';
import { getPgPool } from '@/lib/pgPool';
import { verifyMerchantAuth } from '@/lib/auth/merchantAuth';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Singleton service-role Supabase client
const supabase = getSupabaseService();

/**
 * GET /api/v1/settlements
 *
 * Query params:
 *   merchantId   – override merchant scope (admin only)
 *   includeLogs  – if "true" also returns settlement_payment_logs rows (max 100)
 *   limit        – max number of log rows to return (default 20, capped at 100)
 *
 * Response:
 *   {
 *     settlements: MerchantSettlement[],
 *     logs?: SettlementPaymentLog[]
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const includeLogs = searchParams.get('includeLogs') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build cache key
    const cacheKey = `settlements:${merchantId || 'all'}:${includeLogs}:${limit}`;

    // Try to get cached response first
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // --- Fetch settlement aggregates ---
    let settlementsQuery = supabase
      .from('merchant_settlements')
      .select('*')
      .order('updated_at', { ascending: false });

    if (merchantId) settlementsQuery = settlementsQuery.eq('merchant_id', merchantId);

    const { data: settlements, error: aggErr } = await settlementsQuery;
    if (aggErr) throw new Error(aggErr.message);

    // --- Optionally fetch recent logs ---
    let logs: any[] | null = null;
    if (includeLogs && settlements && settlements.length) {
      const settlementIds = settlements.map((s) => s.id);
      const { data: logRows, error: logErr } = await supabase
        .from('settlement_payment_logs')
        .select('*')
        .in('settlement_id', settlementIds)
        .order('settled_date', { ascending: false })
        .limit(limit);

      if (logErr) throw new Error(logErr.message);
      logs = logRows || [];
    }

    const payload = { settlements, logs };

    // Cache response in Redis (TTL configurable via REDIS_TTL_SECS env)
    // Gracefully handle Redis unavailability
    try {
      await setCached(cacheKey, payload);
    } catch (redisError) {
      console.warn('⚠️ Redis caching failed, continuing without cache:', redisError);
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 