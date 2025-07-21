// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

/**
 * GET /api/v1/merchant/credentials
 * Returns masked client key + webhook URL + rate limits
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only merchants can access their credentials, admins can impersonate via header merchantId param
  const merchantId = auth.role === 'merchant' ? auth.merchantId : request.nextUrl.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id_required' }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data: client, error } = await supabase
    .from('clients')
    .select('client_key, webhook_url, fee_percent, usage_rate_limit')
    .eq('id', merchantId)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
  }

  // Mask key for UI – show last 4 chars only
  const maskedKey = client.client_key.replace(/.(?=.{4})/g, '*');

  return NextResponse.json({
    client_key: maskedKey,
    webhook_url: client.webhook_url,
    fee_percent: client.fee_percent,
    rate_limit: client.usage_rate_limit ?? 100,
  });
} 