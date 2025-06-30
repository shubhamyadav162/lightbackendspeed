import { test, expect } from '@playwright/test';
import Redis from 'ioredis';

// Execute only when the E2E suite is explicitly enabled
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

// Environment variables
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const redisUrl = process.env.REDIS_URL || '';

// Constants
const TEST_MERCHANT_ID = 'e2e_analytics_merchant';

/**
 * This test seeds a deterministic payload directly into Redis and then
 * requests the Analytics endpoint. If the API responds with exactly the
 * same payload we seeded, we can be confident that the handler short-circuited
 * at the Redis layer instead of recomputing the aggregation.
 */

test.describe('Analytics API Redis cache-hit flow', () => {
  test('Serves pre-cached analytics payload from Redis', async ({ request }) => {
    if (!shouldRun) test.skip();
    if (!redisUrl) test.skip();

    const redis = new Redis(redisUrl);

    const cacheKey = `analytics:${TEST_MERCHANT_ID}:30`;
    const sentinelPayload = {
      stats: [],
      totals: {
        total_count: 0,
        completed_count: 0,
        failed_count: 0,
        pending_count: 0,
        total_amount: 0,
        completed_amount: 0,
        sentinel: true,
      },
    };

    // Seed cache with known value (TTL 60 s)
    await redis.set(cacheKey, JSON.stringify(sentinelPayload), 'EX', 60);

    // Hit the API route – should return the sentinel payload unchanged
    const res = await request.get(`${baseURL}/api/v1/analytics?merchantId=${TEST_MERCHANT_ID}`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sentinelPayload);

    // Cleanup
    await redis.del(cacheKey);
    await redis.quit();
  });
}); 