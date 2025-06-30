import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Execute only when the E2E suite is explicitly enabled
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

// Environment variables
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const redisUrl = process.env.REDIS_URL || '';

// Constants
const TEST_MERCHANT_ID = 'e2e_analytics_merchant';

// Helper to upsert a deterministic merchant row
async function ensureTestMerchant() {
  if (!supabaseUrl || !supabaseServiceKey) return;
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  await admin.from('merchants').upsert({
    id: TEST_MERCHANT_ID,
    name: 'E2E Analytics Merchant',
    email: 'e2e_analytics@example.com',
    api_key: 'e2e_key',
    api_salt: 'e2e_salt',
    is_active: true,
    is_sandbox: true,
  });
}

test.beforeAll(async () => {
  if (!shouldRun) return;
  await ensureTestMerchant();
});

test.describe('Analytics API caching flow', () => {
  test('GET /api/v1/analytics caches result in Redis', async ({ request }) => {
    if (!shouldRun) test.skip();
    if (!redisUrl) {
      test.skip();
    }
    const redis = new Redis(redisUrl);

    // Flush existing cache key if present
    const cacheKey = `analytics:${TEST_MERCHANT_ID}:30`;
    await redis.del(cacheKey);

    // Perform API request (admin override via query param)
    const res = await request.get(`${baseURL}/api/v1/analytics?merchantId=${TEST_MERCHANT_ID}`);
    expect(res.status()).toBe(200);

    // Verify cache stored
    const cached = await redis.get(cacheKey);
    expect(cached).not.toBeNull();

    // Clean up redis connection
    await redis.quit();
  });
}); 