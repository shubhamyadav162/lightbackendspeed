import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Execute only when the E2E suite is explicitly enabled
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

// Environment variables
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing Supabase env vars – skipping settlement-history E2E');
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

// Constants aligned with MerchantDashboard placeholder props
const TEST_MERCHANT_ID = 'demo_merchant';
const TEST_SETTLED_AMOUNT = 7500; // static for predictable assertions
const TEST_DUE_AMOUNT = 4321.5;   // will format to "4,321.50" in UI

/**
 * Ensure deterministic merchant row exists.
 */
async function ensureTestMerchant() {
  await admin.from('merchants').upsert({
    id: TEST_MERCHANT_ID,
    merchant_name: 'Demo Merchant',
    email: 'demo_merchant@example.com',
    api_key: 'demo_key',
    api_salt: 'demo_salt',
    wallet_balance: 0,
    is_active: true,
    is_sandbox: true,
  });
}

test.beforeAll(async () => {
  if (!shouldRun) return;
  await ensureTestMerchant();
});

test.describe('Merchant settlement history dashboard flow', () => {
  test('displays settlement aggregates and payout logs', async ({ page, request }) => {
    if (!shouldRun) test.skip();

    // 1. Insert/Upsert settlement aggregate row
    const settlementId = crypto.randomUUID();
    await admin.from('merchant_settlements').upsert({
      id: settlementId,
      merchant_id: TEST_MERCHANT_ID,
      settled_amount: TEST_SETTLED_AMOUNT,
      due_amount: TEST_DUE_AMOUNT,
      is_deleted: false,
    });

    // 2. Insert a corresponding payment log row
    const logId = crypto.randomUUID();
    await admin.from('settlement_payment_logs').insert({
      id: logId,
      settlement_id: settlementId,
      amount: TEST_SETTLED_AMOUNT,
      settled_date: new Date().toISOString(),
      remark: 'E2E test payout',
    });

    // 3. Navigate to merchant dashboard page (no auth needed since placeholder merchantId is hardcoded)
    await page.goto(`${baseURL}/dashboard/merchant`, { waitUntil: 'networkidle' });

    // 4. Validate settlement card shows due and settled amounts
    const dueString = TEST_DUE_AMOUNT.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const settledString = TEST_SETTLED_AMOUNT.toLocaleString(undefined, { minimumFractionDigits: 2 });

    await expect(page.locator('div').filter({ hasText: TEST_MERCHANT_ID })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: dueString })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: settledString })).toBeVisible();

    // 5. Validate payout log appears in table
    await expect(page.locator('table').filter({ hasText: logId })).toBeVisible();
  });
}); 