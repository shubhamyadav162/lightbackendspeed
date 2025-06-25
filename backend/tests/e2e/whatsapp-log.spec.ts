import { test, expect } from '@playwright/test';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';

test.describe('WhatsApp log pagination', () => {
  test('fetch first and second page', async ({ request }) => {
    const page1 = await request.get(`${baseURL}/admin/whatsapp?page=1`);
    expect(page1.ok()).toBeTruthy();
    const data1 = await page1.json();
    expect(Array.isArray(data1)).toBe(true);

    const page2 = await request.get(`${baseURL}/admin/whatsapp?page=2`);
    expect(page2.ok()).toBeTruthy();
    const data2 = await page2.json();
    expect(Array.isArray(data2)).toBe(true);

    if (data1.length && data2.length) {
      // Ensure pagination does not return duplicate first row
      expect(data1[0].id).not.toBe(data2[0].id);
    }
  });
}); 