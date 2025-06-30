import { test, expect, request } from '@playwright/test';

// Basic smoke test for Next.js API route availability.

// Skip these tests unless PLAYWRIGHT_E2E=1 is provided (prevents CI failures until e2e infra is ready)
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

test('GET /api/v1/settlements responds with 401 when unauthenticated', async () => {
  // Use Playwright's built-in APIRequestContext.
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
  const apiContext = await request.newContext({ baseURL });

  const res = await apiContext.get('/api/v1/settlements');
  expect(res.status()).toBe(401);

  const body = await res.json();
  expect(body).toHaveProperty('error');
}); 