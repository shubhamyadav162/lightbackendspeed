// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/v1/merchant/usage
 * Returns basic API usage stats for last 24h.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchantId = auth.role === 'merchant' ? auth.merchantId : request.nextUrl.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id_required' }, { status: 400 });
  }

  // Aggregate transactions count & amount in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, status')
    .eq('client_id', merchantId)
    .gte('created_at', since);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRequests = data.length;
  const totalAmount = data.reduce((acc, t) => acc + (t.amount as unknown as number), 0);
  const errorRate = data.filter((t) => t.status !== 'paid').length / Math.max(totalRequests, 1);

  return NextResponse.json({ total_requests: totalRequests, total_amount: totalAmount, error_rate: Number(errorRate.toFixed(4)) });
} 