// @ts-nocheck
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
    throw new Error('Missing Supabase env vars for queue actions E2E');
  }
  await ensureTestAdmin();
});

test.describe('Queue pause/resume flow', () => {
  test('POST /api/v1/admin/queues/pause schedules audit log and worker processes', async ({ request }) => {
    if (!shouldRun) test.skip();

    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data: auth } = await client.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    const accessToken = auth.session?.access_token;

    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: { Cookie: `sb-access-token=${accessToken}` },
    });

    const queueName = 'payment';

    // Action: pause queue
    const res = await apiContext.post('/api/v1/admin/queues/pause', {
      data: { queueName, action: 'pause' },
    });
    expect(res.status()).toBe(200);

    // Wait for worker to set processed flag (up to 5 seconds)
    const svc = createClient(supabaseUrl, supabaseServiceKey);
    const start = Date.now();
    let processed = false;
    while (Date.now() - start < 5000 && !processed) {
      const { data: log } = await svc
        .from('audit_logs')
        .select('processed, action')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (log?.processed && log.action === 'PAUSE') processed = true;
      if (!processed) await new Promise((r) => setTimeout(r, 500));
    }

    expect(processed).toBe(true);

    // Resume queue similarly
    const res2 = await apiContext.post('/api/v1/admin/queues/pause', {
      data: { queueName, action: 'resume' },
    });
    expect(res2.status()).toBe(200);
  });
}); 