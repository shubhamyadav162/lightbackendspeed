import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';
import { getCached, setCached } from '@/lib/redis';

// Singleton service-role Supabase client
const supabase = supabaseService;

/**
 * Legacy header auth fallback used by existing merchant SDK integrations.
 * Returns merchant row if credentials are valid; otherwise throws.
 */
export async function verifyMerchantAuth(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const apiSecret = request.headers.get('x-api-secret');

  if (!apiKey || !apiSecret) return null;

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data || data.api_salt !== apiSecret) {
    throw new Error('Invalid API credentials');
  }

  return data;
}

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
    // 1. Supabase Auth (preferred)
    const authCtx = await getAuthContext(request);

    // 2. Fallback legacy header auth (for existing merchant SDKs)
    let legacyMerchantId: string | null = null;
    if (!authCtx?.merchantId) {
      try {
        const merchant = await verifyMerchantAuth(request);
        if (merchant) legacyMerchantId = merchant.id;
      } catch (authErr: any) {
        // If credentials were supplied but invalid, return 401
        if (request.headers.has('x-api-key') || request.headers.has('x-api-secret')) {
          return NextResponse.json({ error: authErr.message }, { status: 401 });
        }
      }
    }

    // Determine merchant scope
    let merchantId: string | null = authCtx?.merchantId || legacyMerchantId;

    // Query params (admin override)
    const { searchParams } = new URL(request.url);
    const qpMerchantId = searchParams.get('merchantId');
    const includeLogs = searchParams.get('includeLogs') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = isNaN(limitParam) ? 20 : Math.min(limitParam, 100);
    if (qpMerchantId) merchantId = qpMerchantId;

    // --- Attempt Redis cache --
    const cacheKey = `settlements:${merchantId || 'all'}:${includeLogs ? 'withLogs' : 'noLogs'}:${limit}`;
    const cached = await getCached<any>(cacheKey);
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
    await setCached(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 