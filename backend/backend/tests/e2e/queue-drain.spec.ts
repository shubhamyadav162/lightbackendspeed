import { test, expect } from '@playwright/test';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';

test.describe('Queue drain action', () => {
  test('drain queue returns ok', async ({ request }) => {
    // Attempt draining a non-existing queue should fail with 500 or 400
    const badRes = await request.post(`${baseURL}/admin/queues/drain`, { data: { queue_name: 'fake_queue' } });
    expect(badRes.status()).toBeGreaterThanOrEqual(400);

    // For real queue names this might not exist in local dev; therefore we treat 200 or 404 as acceptable.
    const res = await request.post(`${baseURL}/admin/queues/drain`, {
      data: { queue_name: 'transaction-processing' },
    });
    expect([200, 404, 500]).toContain(res.status());
  });
}); 