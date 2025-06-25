// Queue Metrics Recorder Worker (Phase 1 Task – queue monitoring)
// Records BullMQ queue stats into the `queue_metrics` table on Supabase at a fixed interval.
// Interval can be tuned via QUEUE_RECORD_INTERVAL_MS (defaults to 60000 ms).

import { Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";

const connection = {
  url: process.env.REDIS_URL!,
};

// Support custom BullMQ prefix to avoid collisions when sharing Redis instance
const queuePrefix = process.env.BULLMQ_PREFIX || 'lightspeed';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Target queue names – keep in sync with other workers
const QUEUE_NAMES = [
  "transaction-processing",
  "webhook-processing",
  "whatsapp-notifications",
];

// Lazily initialise Queue instances
const queues = new Map<string, Queue>();
for (const name of QUEUE_NAMES) {
  queues.set(
    name,
    new Queue(name, {
      connection,
      prefix: queuePrefix,
    }),
  );
}

async function recordMetrics() {
  const recorded_at = new Date();

  for (const [name, queue] of queues.entries()) {
    try {
      const counts = await queue.getJobCounts("waiting", "active", "completed", "failed");

      await supabase.from("queue_metrics").insert({
        queue_name: name,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        recorded_at,
      });
    } catch (err) {
      console.error(`[queue-metrics-recorder] Failed to record metrics for ${name}:`, err);
    }
  }
}

const intervalMs = Number(process.env.QUEUE_RECORD_INTERVAL_MS) || 60_000;
console.log(`[queue-metrics-recorder] Starting worker – interval ${intervalMs} ms`);

// Immediately run once on start
recordMetrics();

// Then run periodically
const handle = setInterval(recordMetrics, intervalMs);

// Graceful shutdown
async function shutdown() {
  clearInterval(handle);
  for (const queue of queues.values()) {
    await queue.close();
  }
  console.log("[queue-metrics-recorder] Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); 