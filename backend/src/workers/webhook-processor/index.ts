// @ts-nocheck
// Webhook Processor Worker (Phase 1 Task 3)
// Consumes BullMQ queue 'webhook-processing' – updates transaction status and commissions.

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { calculateCommission } from "../../lib/commission-calculator";

const connection = { url: process.env.REDIS_URL! };
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Helper: determine transaction_id & status from varying PSP payloads
function parseWebhook(data: any): { transaction_id: string; status: string } {
  // Razorpay example structure
  if (data?.payload?.payment?.entity?.notes?.transaction_id) {
    return {
      transaction_id: data.payload.payment.entity.notes.transaction_id,
      status: data.event === "payment.captured" ? "paid" : "failed",
    };
  }

  // PayU example structure
  if (data?.txnid) {
    return {
      transaction_id: data.txnid,
      status: (data.status ?? "failed").toLowerCase() === "success" ? "paid" : "failed",
    };
  }

  // Fallback
  return {
    transaction_id: data.transaction_id ?? "",
    status: data.status ?? "failed",
  };
}

export const worker = new Worker(
  "webhook-processing",
  async (job) => {
    const { webhook_data } = job.data;

    const { transaction_id, status } = parseWebhook(webhook_data);

    // Update transaction status
    await supabase
      .from("client_transactions")
      .update({ status, gateway_response: webhook_data })
      .eq("id", transaction_id);

    if (status === "paid") {
      // Fetch txn details for commission
      const { data: txn } = await supabase
        .from("client_transactions")
        .select("id, amount, client_id")
        .eq("id", transaction_id)
        .single();

      const { data: client } = await supabase
        .from("clients")
        .select("fee_percent, webhook_url")
        .eq("id", txn.client_id)
        .single();

      await calculateCommission(transaction_id, txn.amount, client.fee_percent);

      // Forward webhook to merchant if configured
      if (client.webhook_url) {
        // Insert / update webhook_events tracking row
        const { data: existingEvent } = await supabase
          .from("webhook_events")
          .select("id, attempts")
          .eq("transaction_id", transaction_id)
          .single();

        const attempts = existingEvent?.attempts ?? 0;
        const now = new Date();

        // Attempt to send webhook
        let forwardStatus: "sent" | "failed" = "sent";
        let errorMsg: string | null = null;
        try {
          const fwRes = await fetch(client.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_id,
              status,
              amount: txn.amount,
            }),
            // Optional: add timeout handling separately if needed
          });
          if (!fwRes.ok) {
            forwardStatus = "failed";
            errorMsg = `HTTP_${fwRes.status}`;
          }
        } catch (err: any) {
          forwardStatus = "failed";
          errorMsg = err.message;
        }

        if (existingEvent) {
          await supabase
            .from("webhook_events")
            .update({
              attempts: attempts + 1,
              status: forwardStatus,
              last_error: errorMsg,
              next_retry_at: forwardStatus === "failed" ? new Date(now.getTime() + 15 * 60 * 1000) : null,
            })
            .eq("id", existingEvent.id);
        } else {
          await supabase.from("webhook_events").insert({
            transaction_id,
            attempts: 1,
            status: forwardStatus,
            last_error: errorMsg,
            next_retry_at: forwardStatus === "failed" ? new Date(now.getTime() + 15 * 60 * 1000) : null,
          });
        }
      }
    }
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_WEBHOOK) || 50, attempts: 5 }
);

worker.on("completed", (job) => {
  console.log(`[webhook-processor] Job ${job.id} completed.`);
}); 