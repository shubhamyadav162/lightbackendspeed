// Worker Health Monitor – raises alerts if any worker has gone stale
// Runs on an interval governed by HEALTH_MONITOR_INTERVAL_MS (default 60s)
// and considers a worker stale if its last_ping is older than HEALTH_STALE_THRESHOLD_MS (default 120s).

import { createClient } from "@supabase/supabase-js";

const INTERVAL_MS = Number(process.env.HEALTH_MONITOR_INTERVAL_MS) || 60_000;
const STALE_THRESHOLD_MS = Number(process.env.HEALTH_STALE_THRESHOLD_MS) || 120_000;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkStaleWorkers() {
  const { data: workers, error } = await supabase
    .from("worker_health")
    .select("worker_name,last_ping");

  if (error) {
    console.error("[worker-health-monitor] Failed to fetch worker_health:", error);
    return;
  }

  const now = Date.now();
  const stale = (workers ?? []).filter((w) => {
    return new Date(w.last_ping).getTime() < now - STALE_THRESHOLD_MS;
  });

  for (const w of stale) {
    // Insert alert (idempotency based on worker_name & is_resolved=false)
    await supabase.from("alerts").upsert(
      {
        type: "system",
        severity: "critical",
        message: `Worker ${w.worker_name} heartbeat stale`,
        details: { last_ping: w.last_ping },
        is_resolved: false,
      },
      {
        onConflict: "message", // prevents duplicate alerts for same worker
      },
    );
  }
}

console.log(
  `[worker-health-monitor] Monitoring every ${INTERVAL_MS}ms – stale after ${STALE_THRESHOLD_MS}ms`,
);

// Immediately run
checkStaleWorkers();

const handle = setInterval(checkStaleWorkers, INTERVAL_MS);

async function shutdown() {
  clearInterval(handle);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); 