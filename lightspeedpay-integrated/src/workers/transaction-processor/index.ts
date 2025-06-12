// @ts-nocheck
// Transaction Processor Worker (Phase 1 Task 3)
// Consumes BullMQ queue 'transaction-processing' and calls PSP APIs.

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";

const connection = { url: process.env.REDIS_URL! };
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Helper: create order on PSP (stubbed per provider)
async function createOrder(
  provider: string,
  creds: { api_key: string; api_secret: string },
  payload: {
    amount: number;
    order_id: string;
    transaction_id: string;
    redirect_url?: string | null;
  },
) {
  switch (provider) {
    case "razorpay": {
      const body = {
        amount: payload.amount, // in paisa
        currency: "INR",
        receipt: payload.order_id,
        notes: { transaction_id: payload.transaction_id },
      } as Record<string, unknown>;
      if (payload.redirect_url) body["callback_url"] = payload.redirect_url;

      const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`RAZORPAY_ORDER_FAILED_${errText}`);
      }
      const json = await res.json();
      const gateway_txn_id = json.id;
      const checkout_url = `https://checkout.razorpay.com/v1/checkout.js?order_id=${gateway_txn_id}`;
      return { gateway_txn_id, checkout_url };
    }
    case "payu": {
      // TODO: Implement real PayU API once credentials & endpoints are known.
      const gateway_txn_id = `payu_${payload.transaction_id}`;
      const checkout_url =
        `https://secure.payu.in/_payment?txnid=${gateway_txn_id}&amount=${payload.amount}`;
      return { gateway_txn_id, checkout_url };
    }
    default: {
      throw new Error(`UNSUPPORTED_PROVIDER_${provider}`);
    }
  }
}

export const worker = new Worker(
  "transaction-processing",
  async (job) => {
    const { client_id, gateway_id, amount, order_id, transaction_id, redirect_url } = job.data;

    // 1. Fetch gateway credentials
    const { data: gateway, error: gwErr } = await supabase
      .from("payment_gateways")
      .select("provider, api_key, api_secret")
      .eq("id", gateway_id)
      .single();

    if (gwErr || !gateway) {
      throw new Error(gwErr?.message || "GATEWAY_NOT_FOUND");
    }

    // 2. Create order on PSP (stubbed)
    const { gateway_txn_id, checkout_url } = await createOrder(gateway.provider, gateway, {
      amount,
      order_id,
      transaction_id,
      redirect_url,
    });

    // 3. Persist transaction details
    await supabase
      .from("client_transactions")
      .update({ gateway_txn_id, status: "pending", gateway_response: { provider: gateway.provider } })
      .eq("id", transaction_id);

    return { checkout_url };
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_TRANSACTION) || 25 }
);

worker.on("completed", (job) => {
  console.log(`[transaction-processor] Job ${job.id} completed.`);
}); 