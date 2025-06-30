import { createClient } from "@supabase/supabase-js";
import { sendSlackMessage } from "../../lib/slack";
import { createPayout } from "../../lib/psp/razorpay";

// Commission Payout Processor – Auto-settles merchant commission balances
// Runs as a standalone worker service in Railway / cron container. It scans
// commission_wallets and, when the balance exceeds MIN_PAYOUT_AMOUNT (default
// 1000 ₹ = 100000 paisa), it issues a payout via PSP API (TODO – implement real
// Razorpay/PayU transfer) and records a negative COMMISSION_PAYOUT entry. The
// wallet balance_due is decremented atomically in the same transaction to
// avoid race conditions.

const INTERVAL_MS = Number(process.env.COMMISSION_PAYOUT_INTERVAL_MS) || 24 * 60 * 60_000; // default: 24 h
const MIN_PAYOUT_AMOUNT = Number(process.env.MIN_PAYOUT_AMOUNT_PAISE) || 1000 * 100; // default: ₹1000 in paisa

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function processPayouts() {
  const { data: wallets, error } = await supabase
    .from("commission_wallets")
    .select("id, client_id, balance_due")
    .gte("balance_due", MIN_PAYOUT_AMOUNT);

  if (error) {
    console.error("[commission-payout] wallet fetch failed", error);
    return;
  }

  for (const w of wallets ?? []) {
    try {
      const payoutAmount = w.balance_due;

      // Perform Razorpay payout – returns id & status
      const payout = await createPayout({
        amountPaise: payoutAmount,
        notes: { wallet_id: w.id, client_id: w.client_id },
      });

      if (payout.status !== "processing" && payout.status !== "queued") {
        throw new Error(`Unexpected payout status ${payout.status}`);
      }

      const { error: entryErr } = await supabase.rpc("process_commission_payout", {
        p_wallet_id: w.id,
        p_amount: payoutAmount,
      });

      if (entryErr) throw entryErr;

      await sendSlackMessage(
        `💸 Commission payout *queued* (id: ${payout.id}) of ₹${(payoutAmount / 100).toFixed(2)} for client ${w.client_id}`,
      );
      console.log(
        `Commission payout queued: client=${w.client_id}, amount=${payoutAmount}, payout_id=${payout.id}`,
      );
    } catch (err) {
      console.error("[commission-payout] failed to process payout", err);
      await sendSlackMessage(
        `❌ Commission payout failed for client ${w.client_id}: ${(err as Error).message}`,
      );
    }
  }
}

console.log(
  `[commission-payout] Scanning every ${INTERVAL_MS} ms | threshold paisa=${MIN_PAYOUT_AMOUNT}`,
);

// Immediate run, then interval
await processPayouts();
const handle = setInterval(processPayouts, INTERVAL_MS);

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    clearInterval(handle);
    process.exit(0);
  });
} 