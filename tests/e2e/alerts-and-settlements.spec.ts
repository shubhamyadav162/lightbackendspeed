import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Run only when the full E2E suite is enabled
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

// Environment configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY – skipping alerts/settlements E2E');
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

const TEST_MERCHANT_ID = 'e2e_merchant';

const failedTxnPoll = async (txnId: string, maxRetries = 15): Promise<boolean> => {
  let retries = maxRetries;
  while (retries-- > 0) {
    const { data } = await admin
      .from('alerts')
      .select('id, message, transaction_id')
      .ilike('message', `%${txnId}%`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
};

test.describe('Alerts and Settlements Edge Flows', () => {
  test('failed transaction generates alert row via Edge Function', async () => {
    // 1. Insert failed transaction row directly (simulating gateway failure)
    const txnId = `E2E_FAIL_${crypto.randomUUID().slice(0, 8)}`;

    const { data: inserted, error } = await admin.from('transactions').insert({
      merchant_id: TEST_MERCHANT_ID,
      txn_id: txnId,
      amount: 123,
      currency: 'INR',
      status: 'FAILED',
      payment_method: 'upi',
    }).select('id').single();

    if (error) throw error;
    expect(inserted).toBeTruthy();

    // 2. Poll for corresponding alert row
    const alertFound = await failedTxnPoll(txnId);
    expect(alertFound).toBe(true);
  });

  test('process-settlements Edge Function zero-balances due settlements', async ({ request }) => {
    const settlementId = crypto.randomUUID();

    // 1. Insert a due settlement row
    const { error: insertErr } = await admin.from('merchant_settlements').insert({
      id: settlementId,
      merchant_id: TEST_MERCHANT_ID,
      due_amount: 1000,
      settled_amount: 0,
      is_deleted: false,
    });
    if (insertErr) throw insertErr;

    // 2. Call Edge Function endpoint (authenticated with service key)
    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/process-settlements`;
    const res = await request.post(fnUrl, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    expect(res.status()).toBe(200);

    // 3. Verify settlement row is updated
    const { data: updated } = await admin
      .from('merchant_settlements')
      .select('due_amount, settled_amount')
      .eq('id', settlementId)
      .single();

    expect(updated?.due_amount).toBe(0);
    expect((updated?.settled_amount ?? 0) >= 1000).toBe(true);
  });
}); 