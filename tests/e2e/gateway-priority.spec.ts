// @ts-nocheck
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const TEST_ADMIN_EMAIL = 'e2e_admin@example.com';
const TEST_ADMIN_PASSWORD = 'Password123!';

async function ensureTestAdmin() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);
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

  if (userId) {
    await admin.from('users').upsert({ id: userId, email: TEST_ADMIN_EMAIL, role: 'admin' });
  }
}

test.beforeAll(async () => {
  if (!shouldRun) return;
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars for gateway priority E2E');
  }
  await ensureTestAdmin();
});

test.describe('Gateway bulk priority update flow', () => {
  test('PUT /api/v1/admin/gateways/priority reorders priorities', async ({ page, context, request }) => {
    if (!shouldRun) test.skip();

    const admin = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await admin.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    if (error || !data.session) throw error || new Error('Unable to sign in admin');
    const accessToken = data.session.access_token;

    await context.addCookies([{ name: 'sb-access-token', value: accessToken, url: baseURL, path: '/' }]);

    // Fetch existing gateways via service role
    const svc = createClient(supabaseUrl, supabaseServiceKey);
    const { data: gateways } = await svc.from('payment_gateways').select('id, priority').order('priority');
    if (!gateways || gateways.length < 2) {
      throw new Error('At least two gateways needed for priority test');
    }

    // Reverse order priorities
    const reversed = [...gateways].reverse().map((g, idx) => ({ id: g.id, priority: idx + 1 }));

    const apiContext = await request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `sb-access-token=${accessToken}` } });
    const res = await apiContext.put('/api/v1/admin/gateways/priority', { data: { updates: reversed } });
    expect(res.status()).toBe(200);

    // Verify DB values updated
    const { data: updated } = await svc.from('payment_gateways').select('id, priority').order('priority');
    expect(updated?.map((g) => g.id)).toEqual(reversed.map((r) => r.id));

    // Optional UI validation
    try {
      await page.goto(`${baseURL}/dashboard/admin/gateways`, { waitUntil: 'networkidle' });
      await expect(page.locator('table')).toBeVisible();
    } catch {}
  });
}); 