import { Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { sendSlackMessage } from "../../lib/slack";

// Low Balance Notifier – periodically checks commission_wallets and enqueues WhatsApp notifications
// if balance_due exceeds warn_threshold and a notification hasn't been sent recently.
// Interval controlled via LOW_BALANCE_SCAN_INTERVAL_MS (default 5 min)
// Cool-off between notifications via LOW_BALANCE_COOLDOWN_MS (default 24 h)

const SCAN_INTERVAL_MS = Number(process.env.LOW_BALANCE_SCAN_INTERVAL_MS) || 5 * 60_000; // 5 minutes
const COOLDOWN_MS = Number(process.env.LOW_BALANCE_COOLDOWN_MS) || 24 * 60 * 60_000; // 24 hours

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const waQueue = new Queue("whatsapp-notifications", {
  connection: { url: process.env.REDIS_URL! },
});

async function scanAndNotify() {
  const { data: wallets, error } = await supabase
    .from("commission_wallets")
    .select("id, client_id, balance_due, warn_threshold, wa_last_sent")
    .gt("balance_due", "warn_threshold");

  if (error) {
    console.error("[low-balance-notifier] Failed to fetch wallets:", error);
    return;
  }

  const now = Date.now();
  for (const w of wallets ?? []) {
    const lastSent = w.wa_last_sent ? new Date(w.wa_last_sent).getTime() : 0;
    if (now - lastSent < COOLDOWN_MS) continue; // skip within cooldown

    // Insert whatsapp_notifications row
    const { data: notif, error: notifErr } = await supabase
      .from("whatsapp_notifications")
      .insert({
        client_id: w.client_id,
        template: process.env.WA_TEMPLATE_LOW_BALANCE ?? "low_balance_template",
        type: "LOW_BALANCE",
        payload_json: { balance_due: w.balance_due },
      })
      .select()
      .single();

    if (notifErr || !notif) {
      console.error("[low-balance-notifier] Insert notification failed", notifErr);
      continue;
    }

    // Update wa_last_sent
    await supabase
      .from("commission_wallets")
      .update({ wa_last_sent: new Date() })
      .eq("id", w.id);

    // Enqueue WA send job
    await waQueue.add("send", {
      client_id: w.client_id,
      template: notif.template,
      payload: { balance_due: w.balance_due },
    });

    console.log(`Enqueued LOW_BALANCE WA for client ${w.client_id}`);

    // NEW: Slack notify for low balance
    await sendSlackMessage(`🔔 Wallet balance due for client ${w.client_id} is ${(w.balance_due / 100).toFixed(2)} ₹ (threshold ${(w.warn_threshold / 100).toFixed(2)} ₹)`);
  }
}

console.log(
  `[low-balance-notifier] Scanning every ${SCAN_INTERVAL_MS}ms (cooldown ${COOLDOWN_MS}ms)`,
);

// Immediate run
scanAndNotify();

const interval = setInterval(scanAndNotify, SCAN_INTERVAL_MS);

process.on("SIGINT", () => {
  clearInterval(interval);
  process.exit(0);
});

process.on("SIGTERM", () => {
  clearInterval(interval);
  process.exit(0);
}); 