import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Authenticated flow E2E tests – requires PLAYWRIGHT_E2E=1 and Supabase env vars.
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

// Environment configuration
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Test identities (safe to hard-code for CI as they exist only in test project)
const TEST_MERCHANT_EMAIL = 'e2e_merchant@example.com';
const TEST_MERCHANT_PASSWORD = 'Password123!';
const TEST_MERCHANT_ID = 'e2e_merchant';

// Utility: ensure test merchant & user exist before running suite.
async function ensureTestMerchant() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Upsert merchant row
  await admin.from('merchants').upsert({
    id: TEST_MERCHANT_ID,
    merchant_name: 'E2E Merchant',
    email: TEST_MERCHANT_EMAIL,
    api_key: 'e2e_key',
    api_salt: 'e2e_salt',
    wallet_balance: 0,
    is_active: true,
    is_sandbox: true,
  });

  // 2. Ensure auth user exists & email confirmed
  const { data: existing } = await admin.auth.admin.getUserByEmail(TEST_MERCHANT_EMAIL);
  let userId = existing?.user?.id;
  if (!userId) {
    const { data: created } = await admin.auth.admin.createUser({
      email: TEST_MERCHANT_EMAIL,
      password: TEST_MERCHANT_PASSWORD,
      email_confirm: true,
    });
    userId = created.user?.id;
  }

  // 3. Upsert metadata in users table
  if (userId) {
    await admin.from('users').upsert({
      id: userId,
      email: TEST_MERCHANT_EMAIL,
      role: 'merchant',
      merchant_id: TEST_MERCHANT_ID,
    });
  }
}

test.beforeAll(async () => {
  if (!shouldRun) return;
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing required Supabase env vars for authenticated E2E tests');
  }
  await ensureTestMerchant();
});

test.describe('Authenticated Merchant Dashboard', () => {
  test('successful login via cookie and dashboard access', async ({ page, context }) => {
    // Sign in to get JWT token
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_MERCHANT_EMAIL,
      password: TEST_MERCHANT_PASSWORD,
    });
    if (error || !data.session) throw error || new Error('Unable to sign in test merchant');

    const accessToken = data.session.access_token;

    // Set auth cookie recognised by backend (sb-access-token)
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: accessToken,
        url: baseURL,
        path: '/',
      },
    ]);

    // Navigate to merchant dashboard
    await page.goto(`${baseURL}/dashboard/merchant`, { waitUntil: 'networkidle' });

    // Expect heading present
    await expect(page.getByRole('heading', { name: 'Merchant Dashboard' })).toBeVisible();
  });

  test('create transaction via API and verify table refresh', async ({ page, context, request }) => {
    // Assumes previous test created cookie; if running standalone we sign in again.
    const cookies = await context.cookies();
    const hasJwt = cookies.some((c) => c.name === 'sb-access-token');
    if (!hasJwt) {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await client.auth.signInWithPassword({
        email: TEST_MERCHANT_EMAIL,
        password: TEST_MERCHANT_PASSWORD,
      });
      if (error || !data.session) throw error || new Error('Unable to sign in test merchant');
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: data.session.access_token,
          url: baseURL,
          path: '/',
        },
      ]);
    }

    // Create transaction via API (uses merchant auth)
    const apiContext = await request.newContext({ baseURL, extraHTTPHeaders: { Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') } });

    const amount = Math.floor(Math.random() * 1000) + 100;
    const txnRes = await apiContext.post('/api/v1/pay', {
      data: {
        amount,
        customer_email: 'cust@example.com',
        payment_method: 'upi',
      },
    });
    expect(txnRes.status()).toBe(200);
    const txnJson = await txnRes.json();
    expect(txnJson).toHaveProperty('txn_id');

    // Wait for dashboard table to refresh – polling for new row with txn_id
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('table').filter({ hasText: txnJson.txn_id })).toBeVisible();
  });
}); 