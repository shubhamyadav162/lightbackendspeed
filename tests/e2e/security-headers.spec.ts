// @ts-nocheck
import { test, expect } from '@playwright/test';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';

const SEC_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'strict-transport-security',
  'content-security-policy',
  'referrer-policy',
];

test.describe('Security headers', () => {
  test('Global middleware sets core security headers', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/v1/health`);
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();
    for (const header of SEC_HEADERS) {
      expect(headers).toHaveProperty(header);
    }
  });
}); 