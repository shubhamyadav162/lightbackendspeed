import { test, expect } from '@playwright/test';

// PLAYWRIGHT_E2E guard - only run when env var set
const isE2E = !!process.env.PLAYWRIGHT_E2E;
(isE2E ? test : test.skip)('Admin can view gateways list', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  // Navigate to Gateways tab
  await page.click('text=Gateways');
  // Wait for gateway cards to appear
  await page.waitForSelector('[data-testid="gateway-row"]', { timeout: 10000 });
  const gateways = await page.$$('[data-testid="gateway-row"]');
  expect(gateways.length).toBeGreaterThan(0);
}); 