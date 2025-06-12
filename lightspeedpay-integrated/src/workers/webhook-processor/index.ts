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
        .select("fee_percent")
        .eq("id", txn.client_id)
        .single();

      await calculateCommission(transaction_id, txn.amount, client.fee_percent);
    }
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_WEBHOOK) || 50, attempts: 5 }
); 