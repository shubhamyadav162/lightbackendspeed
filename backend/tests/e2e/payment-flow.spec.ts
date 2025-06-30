import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Constants
const TEST_CLIENT_KEY = 'e2e_client_key';
const TEST_CLIENT_SALT = 'e2e_salt_12345678901234567890123456789012';

function hmacSha256(message: string, key: string) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

test.describe('End-to-end payment flow (Edge → Queue → Workers → Commission)', () => {
  test('completes payment creation & updates transaction table', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) test.skip();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Ensure test client exists (idempotent)
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('client_key', TEST_CLIENT_KEY)
      .single();

    let client_id: string;
    if (clientRow) {
      client_id = clientRow.id;
    } else {
      const { data: inserted } = await supabase
        .from('clients')
        .insert({
          client_key: TEST_CLIENT_KEY,
          client_salt: TEST_CLIENT_SALT,
          company_name: 'E2E Test Merchant',
        })
        .select()
        .single();
      client_id = inserted!.id;
    }

    const order_id = `ORDER_${Date.now()}`;
    const amount = 12345; // ₹123.45
    const signature = hmacSha256(`${TEST_CLIENT_KEY}|${order_id}|${amount}`, TEST_CLIENT_SALT);

    // 2. Call payment-initiate Edge Function via backend proxy
    const res = await request.post(`${baseURL}/payment/initiate`, {
      data: {
        amount,
        order_id,
        client_key: TEST_CLIENT_KEY,
        signature,
      },
    });

    expect(res.status()).toBe(200);
    const { transaction_id } = await res.json();
    expect(transaction_id).toBeTruthy();

    // 3. Verify transaction row exists in DB with status 'created'
    const { data: txn } = await supabase
      .from('client_transactions')
      .select('status, amount, order_id')
      .eq('id', transaction_id)
      .single();

    expect(txn?.status).toBe('created');
    expect(txn?.amount).toBe(amount);
    expect(txn?.order_id).toBe(order_id);
  });
}); 