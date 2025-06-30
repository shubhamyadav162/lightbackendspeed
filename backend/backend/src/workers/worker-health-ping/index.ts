// Worker Health Ping (Phase 1 – monitoring)
// Periodically inserts/updates heartbeat rows into `worker_health` table for this worker instance.

import { createClient } from "@supabase/supabase-js";
import os from "os";

const INTERVAL_MS = Number(process.env.WORKER_PING_INTERVAL_MS) || 30_000;
const WORKER_NAME = process.env.WORKER_NAME || "worker-health-ping";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function ping() {
  try {
    await supabase.from("worker_health").upsert(
      {
        worker_name: WORKER_NAME,
        hostname: os.hostname(),
        pid: process.pid,
        last_ping: new Date(),
      },
      { onConflict: "worker_name" },
    );
    console.log(`[worker-health-ping] heartbeat for ${WORKER_NAME}`);
  } catch (err) {
    console.error("[worker-health-ping] failed to ping", err);
  }
}

console.log(
  `[worker-health-ping] Starting heartbeat with interval ${INTERVAL_MS} ms`,
);
// Immediately ping
ping();

const handle = setInterval(ping, INTERVAL_MS);

async function shutdown() {
  clearInterval(handle);
  // No explicit cleanup needed for Supabase client in Node context
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); 