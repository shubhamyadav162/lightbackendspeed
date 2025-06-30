import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: process.env.CI ? 2 : 0,
  use: {
    // Run tests in headless mode with a small viewport to keep resource usage low
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  // If PLAYWRIGHT_BASE_URL is provided use that, otherwise default to local dev
  // Note: For API request tests we don't require browser binaries, so this config allows running without browsers.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 3100',
        cwd: 'lightspeedpay-integrated',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        port: 3100,
      },
}); 