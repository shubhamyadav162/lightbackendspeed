import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TEST_GATEWAY_NAME = 'e2e_gateway_1';

// Helper that removes the gateway row if it already exists – keeps test idempotent
async function cleanup() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await supabase.from('payment_gateways').delete().eq('name', TEST_GATEWAY_NAME);
}

test.describe('Gateway Management – admin endpoints', () => {
  test.beforeAll(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test('create → update → toggle gateway via Edge Function API', async ({ request }) => {
    // 1. Create gateway
    const createRes = await request.post(`${baseURL}/admin/gateways`, {
      data: {
        name: TEST_GATEWAY_NAME,
        provider: 'razorpay',
        api_key: 'rk_test_e2e_key',
        api_secret: 'rk_test_e2e_secret',
        priority: 2,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created.name).toBe(TEST_GATEWAY_NAME);
    expect(created.is_active).toBe(true);

    // 2. Update gateway priority
    const updateRes = await request.patch(`${baseURL}/admin/gateways/${created.id}`, {
      data: { priority: 5 },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.priority).toBe(5);

    // 3. Toggle gateway OFF
    const toggleRes = await request.patch(`${baseURL}/admin/gateways/${created.id}`, {
      data: { is_active: false },
    });
    expect(toggleRes.ok()).toBeTruthy();
    const toggled = await toggleRes.json();
    expect(toggled.is_active).toBe(false);
  });
}); 