// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';
import { Queue } from 'bullmq';

const webhookQueue = new Queue('webhook-processing', { connection: { host: process.env.REDIS_HOST } });

/**
 * POST /api/v1/merchant/webhooks/test
 * Body: { test_payload?: object }
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'merchant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));

  // Fetch merchant data
  const supabase = getSupabaseService();
  const { data: client, error } = await supabase
    .from('clients')
    .select('webhook_url')
    .eq('id', auth.merchantId!)
    .single();

  if (error || !client?.webhook_url) {
    return NextResponse.json({ error: 'webhook_url_not_configured' }, { status: 400 });
  }

  await webhookQueue.add('test', {
    merchant_id: auth.merchantId,
    webhook_url: client.webhook_url,
    payload: body?.test_payload || { message: 'Webhook test', timestamp: Date.now() },
  });

  return NextResponse.json({ status: 'queued' });
} 