import { Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { sendSlackMessage } from "../../lib/slack";

const INTERVAL_MS = Number(process.env.SYSTEM_HEALTH_INTERVAL_MS) || 60 * 60 * 1000; // default 1h
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL!;
const BULLMQ_PREFIX = process.env.BULLMQ_PREFIX || "lightspeed";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const queues = [
  new Queue("transaction-processing", { connection: { url: REDIS_URL }, prefix: BULLMQ_PREFIX }),
  new Queue("webhook-processing", { connection: { url: REDIS_URL }, prefix: BULLMQ_PREFIX }),
  new Queue("whatsapp-notifications", { connection: { url: REDIS_URL }, prefix: BULLMQ_PREFIX }),
];

async function buildSummary() {
  // Queue stats
  const stats = await Promise.all(
    queues.map(async (q) => {
      const [waiting, active, failed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getFailedCount(),
      ]);
      return `• *${q.name}*: waiting ${waiting}, active ${active}, failed ${failed}`;
    }),
  );

  // Worker health – count stale workers older than threshold (5 min)
  const STALE_THRESHOLD_MIN = 5;
  const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MIN * 60 * 1000).toISOString();
  const { count: staleCount } = await supabase
    .from("worker_health")
    .select("id", { count: "exact" })
    .lt("last_ping", thresholdDate);

  const summary = [
    `🩺 *LightSpeedPay System Health* (${new Date().toLocaleString()})`,
    ...stats,
    `• *Stale workers*: ${staleCount ?? 0}`,
  ].join("\n");

  await sendSlackMessage(summary);
}

console.log(`[system-health-report] Running every ${INTERVAL_MS} ms`);

// Immediate run
buildSummary().catch((err) => console.error("[system-health-report]", err));

const handle = setInterval(() => {
  buildSummary().catch((err) => console.error("[system-health-report]", err));
}, INTERVAL_MS);

async function shutdown() {
  clearInterval(handle);
  await Promise.all(queues.map((q) => q.close()));
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); 