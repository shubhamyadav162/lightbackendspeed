import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const supabase = getSupabaseService();

// Re-use merchant header verification from the pay route
async function verifyMerchantAuth(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const apiSecret = request.headers.get('x-api-secret');

  if (!apiKey || !apiSecret) {
    // Caller might be an admin dashboard call without merchant headers – skip auth
    return null;
  }

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) {
    throw new Error('Invalid API credentials');
  }

  if (data.api_salt !== apiSecret) {
    throw new Error('Invalid API credentials');
  }

  return data;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Try Supabase Auth (preferred)
    const authCtx = await getAuthContext(request);

    // 2. Fallback header auth (legacy)
    let legacyMerchantId: string | null = null;
    if (!authCtx?.merchantId) {
      try {
        const merchant = await verifyMerchantAuth(request);
        if (merchant) legacyMerchantId = merchant.id;
      } catch (authErr: any) {
        if (request.headers.has('x-api-key') || request.headers.has('x-api-secret')) {
          return NextResponse.json({ error: authErr.message }, { status: 401 });
        }
      }
    }

    // Determine merchantId
    let merchantId: string | null = authCtx?.merchantId || legacyMerchantId;

    // Query params override (admin scenario)
    const { searchParams } = new URL(request.url);
    const qpMerchantId = searchParams.get('merchantId');
    const txnId = searchParams.get('txnId');
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = isNaN(limitParam) ? 20 : Math.min(limitParam, 100);
    if (qpMerchantId) merchantId = qpMerchantId;

    // Build Supabase query
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (merchantId) query = query.eq('merchant_id', merchantId);
    if (txnId) query = query.eq('txn_id', txnId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 