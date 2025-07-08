// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { simpleAdminAuth } from '@/lib/simple-auth';

/**
 * GET /api/v1/merchant/credentials
 * Returns masked client key + webhook URL + rate limits
 * Now uses simpleAdminAuth and requires a merchantId query parameter.
 */
export async function GET(request: NextRequest) {
  const isAdmin = await simpleAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin must provide the merchantId they want to fetch credentials for.
  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id_required' }, { status: 400 });
  }

  const { data: client, error } = await supabaseService
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