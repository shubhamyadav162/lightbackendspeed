import { test, expect, request } from '@playwright/test';

// Additional API smoke tests.
// These tests are skipped unless PLAYWRIGHT_E2E=1 is set (same convention as health.spec.ts).
const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

test.describe('API Smoke Tests', () => {
  // Base URL derived from env or local dev server (see playwright.config.ts).
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';

  test('GET /api/v1/transactions returns 401 when unauthenticated', async () => {
    const apiContext = await request.newContext({ baseURL });

    const res = await apiContext.get('/api/v1/transactions');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/wallets returns 401 when unauthenticated', async () => {
    const apiContext = await request.newContext({ baseURL });

    const res = await apiContext.get('/api/v1/wallets');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/alerts returns 200 and array payload', async () => {
    const apiContext = await request.newContext({ baseURL });

    const res = await apiContext.get('/api/v1/alerts');
    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
}); 