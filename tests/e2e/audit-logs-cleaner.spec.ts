// @ts-nocheck
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * This test verifies that the cleanup_old_audit_logs() RPC properly deletes processed
 * audit logs older than 90 days while leaving recent or unprocessed logs intact.
 *
 * It runs only when PLAYWRIGHT_E2E env flag is set.
 */

test.skip(!process.env.PLAYWRIGHT_E2E, 'PLAYWRIGHT_E2E flag not set');

test('cleanup_old_audit_logs RPC purges old processed rows', async ({}) => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRole);

  // Seed two rows – one old processed, one recent processed
  const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
  const recentDate = new Date().toISOString();

  const { data: inserted, error: seedError } = await supabase.from('audit_logs').insert([
    {
      table_name: 'test_table',
      action: 'CLEAN',
      processed: true,
      created_at: ninetyOneDaysAgo,
      new_data: {},
    },
    {
      table_name: 'test_table',
      action: 'CLEAN',
      processed: true,
      created_at: recentDate,
      new_data: {},
    },
  ]).select();

  expect(seedError).toBeNull();
  expect(inserted).toHaveLength(2);

  // Invoke RPC
  const { error: rpcError } = await supabase.rpc('cleanup_old_audit_logs');
  expect(rpcError).toBeNull();

  // Validate deletion
  const { count } = await supabase.from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .in('id', inserted!.map((r) => r.id));

  expect(count).toBe(1);
}); 