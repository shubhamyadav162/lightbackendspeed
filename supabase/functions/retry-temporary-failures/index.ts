// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: retry-temporary-failures (scheduled)
// Runs every 5 minutes to mark FAILED_TEMPORARY transactions for retry.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  // Find transactions that failed temporarily and haven't been retried in last hour.
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, retry_count")
    .eq("status", "FAILED_TEMPORARY")
    .lte("next_retry_at", new Date().toISOString());

  if (error) {
    console.error("Failed to fetch transactions", error);
    return new Response("Error", { status: 500 });
  }

  for (const txn of txns ?? []) {
    // Push to retry queue by updating status and incrementing retry_count.
    await supabase
      .from("transactions")
      .update({
        status: "RETRY_PENDING",
        retry_count: (txn.retry_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", txn.id);
  }

  return new Response(`Queued ${txns?.length ?? 0} transactions`, { status: 200 });
}); 