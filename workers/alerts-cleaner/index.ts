/* Alerts Retention Cleaner Worker
   Runs daily at 03:15 UTC (configured via external scheduler) to invoke
   public.cleanup_old_alerts() stored procedure and remove resolved alerts
   older than 30 days.
*/
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

(async () => {
  console.log("[alerts-cleaner] Invoking cleanup_old_alerts() ...");
  const { error } = await supabase.rpc("cleanup_old_alerts", { p_days: 30 });
  if (error) {
    console.error("[alerts-cleaner] Failed:", error);
    process.exit(1);
  }
  console.log("[alerts-cleaner] Done – old resolved alerts removed.");
  process.exit(0);
})(); 