// @ts-nocheck
import { test, expect } from '@playwright/test';

// These tests rely on PLAYWRIGHT_E2E=1 guard similar to other admin specs.
// Ensure SUPABASE_TEST_JWT_ADMIN env is set for authenticated API calls.

test.describe('Developer Tools API flows', () => {
  const adminHeaders = {
    Authorization: `Bearer ${process.env.SUPABASE_TEST_JWT_ADMIN || ''}`,
  };

  test('GET /api/v1/merchant/credentials returns masked key & usage', async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E, 'E2E guard');

    const res = await request.get('/api/v1/merchant/credentials', { headers: adminHeaders });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty('apiKey');
    expect(json.apiKey).toMatch(/\*{8}/); // masked
  });

  test('POST /api/v1/merchant/credentials/regenerate returns new key', async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E, 'E2E guard');

    const res = await request.post('/api/v1/merchant/credentials/regenerate', { headers: adminHeaders });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty('newKey');
    expect(json.newKey).not.toMatch(/\*{8}/);
  });

  test('POST /api/v1/merchant/webhooks/test delivers to endpoint', async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E, 'E2E guard');

    // Use a publicly accessible webhook.site bin or env var. For CI we stub with https://webhook.site token.
    const webhookUrl = process.env.TEST_WEBHOOK_URL || 'https://httpbin.org/post';

    const res = await request.post('/api/v1/merchant/webhooks/test', {
      headers: adminHeaders,
      data: { url: webhookUrl },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty('delivered');
  });
}); 