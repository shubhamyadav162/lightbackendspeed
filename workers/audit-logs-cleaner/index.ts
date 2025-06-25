// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

/**
 * Audit Logs Cleaner – invokes cleanup_old_audit_logs() RPC daily via Railway cron.
 * Cron scheduling handled by Railway Dashboard (set to 04:00 UTC).
 */

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[audit-logs-cleaner] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

(async () => {
  console.info('[audit-logs-cleaner] Starting cleanup');
  const { error } = await supabase.rpc('cleanup_old_audit_logs');

  if (error) {
    console.error('[audit-logs-cleaner] Failed to execute RPC', error);
    process.exit(1);
  }

  console.info('[audit-logs-cleaner] Cleanup executed successfully');
})(); 