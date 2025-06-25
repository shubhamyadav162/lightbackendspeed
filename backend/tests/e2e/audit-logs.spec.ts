// @ts-nocheck
import { test, expect } from '@playwright/test';

const ADMIN_JWT = process.env.PLAYWRIGHT_ADMIN_JWT || '';

test.describe('Admin Audit Logs API', () => {
  test('should list audit logs with default limit', async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E, 'E2E flag not set');

    const res = await request.get('/api/v1/admin/audit-logs', {
      headers: {
        Authorization: `Bearer ${ADMIN_JWT}`,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.logs)).toBeTruthy();
  });
}); 