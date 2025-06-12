import { test, expect } from '@playwright/test';

// Assumes authenticated merchant test user credentials from utils.

test.describe('Merchant Integration Center', () => {
  test('displays API credentials and copy buttons', async ({ page }) => {
    // Perform merchant login helper (assumes utility command)
    // For CI we rely on seed script executed before tests which stores credentials in env.
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

    await page.goto(`${baseURL}/dashboard/merchant/integration`);

    await expect(page.getByRole('heading', { name: 'Integration Guide' })).toBeVisible();

    await expect(page.getByText('API Key')).toBeVisible();
    await expect(page.getByText('API Secret')).toBeVisible();

    // Copy button triggers success toast; test visually by clicking
    const copyButtons = page.locator('button', { has: page.locator('svg') });
    if (await copyButtons.first().isVisible()) {
      await copyButtons.first().click();
    }
  });
}); 