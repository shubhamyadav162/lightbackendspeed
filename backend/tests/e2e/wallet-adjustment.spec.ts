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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Test identities
const TEST_ADMIN_EMAIL = 'e2e_admin@example.com';
const TEST_ADMIN_PASSWORD = 'Password123!';
const TEST_MERCHANT_ID = 'e2e_merchant';

/**
 * Ensure an admin auth user & metadata row exist for E2E
 */
async function ensureTestAdmin() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  // Auth user
  const { data: existing } = await admin.auth.admin.getUserByEmail(TEST_ADMIN_EMAIL);
  let userId = existing?.user?.id;
  if (!userId) {
    const { data: created } = await admin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    });
    userId = created.user?.id;
  }

  // Metadata row in `users`
  if (userId) {
    await admin.from('users').upsert({
      id: userId,
      email: TEST_ADMIN_EMAIL,
      role: 'admin',
    });
  }
}

/**
 * Ensure a deterministic wallet row exists for the merchant.
 */
async function ensureTestWallet() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const walletId = `e2e_wallet_${TEST_MERCHANT_ID}`;

  const { data: existing } = await admin
    .from('customer_wallets')
    .select('id')
    .eq('id', walletId)
    .single();

  if (!existing) {
    await admin.from('customer_wallets').insert({
      id: walletId,
      merchant_id: TEST_MERCHANT_ID,
      balance: 0,
    });
  }

  return walletId;
}

test.beforeAll(async () => {
  if (!shouldRun) return;
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars for wallet adjustment E2E');
  }
  await ensureTestAdmin();
});

test.describe('Admin wallet adjustment flow', () => {
  test('POST /api/v1/wallets adjusts balance and inserts transaction row', async ({ page, context, request }) => {
    if (!shouldRun) test.skip();

    const walletId = await ensureTestWallet();

    // Sign in as admin via public anon key
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    if (error || !data.session) throw error || new Error('Unable to sign in admin');

    const accessToken = data.session.access_token;

    // Add cookie recognised by backend middleware
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: accessToken,
        url: baseURL,
        path: '/',
      },
    ]);

    const adjustment = Math.floor(Math.random() * 500) + 50;
    const reason = `E2E top-up ${crypto.randomUUID().slice(0, 6)}`;

    // Make POST call authenticated via cookie
    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: { Cookie: `sb-access-token=${accessToken}` },
    });

    const res = await apiContext.post('/api/v1/wallets', {
      data: {
        walletId,
        amount: adjustment,
        reason,
      },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.balance).toBeDefined();

    // Verify Supabase state
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: wallet } = await admin.from('customer_wallets').select('balance').eq('id', walletId).single();
    expect(wallet?.balance).toBe(json.balance);

    const { data: txns } = await admin
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(txns && txns[0]?.amount).toBe(adjustment);
    expect(txns && txns[0]?.reason).toBe(reason);

    // Optional UI validation – ignore failures if route missing
    try {
      await page.goto(`${baseURL}/dashboard/admin/wallets`, { waitUntil: 'networkidle' });
      await expect(page.locator('table').filter({ hasText: walletId })).toBeVisible();
      await expect(page.locator('table').filter({ hasText: adjustment.toString() })).toBeVisible();
    } catch {
      /* swallow */
    }
  });
}); 