// @ts-nocheck
// Transaction Processor Worker (Phase 1 Task 3)
// Consumes BullMQ queue 'transaction-processing' and calls PSP APIs.

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { decrypt as dec } from "../../lib/encryption";

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
        throw new Error(`PAYMENT_ORDER_FAILED`);
      }
      const json = await res.json();
      const gateway_txn_id = json.id;
      // Return LightSpeed branded checkout URL instead of Razorpay's
      const checkout_url = `https://pay.lightspeedpay.com/checkout/${payload.transaction_id}`;
      return { gateway_txn_id, checkout_url };
    }
    case "payu": {
      // Real PayU integration (Merchant Hosted Checkout)
      // Construct POST form data and return checkout URL that the front-end/mobile SDK can redirect to.
      // Required params: key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash
      const txnid = payload.transaction_id; // reuse our txn id as PayU txnid
      const amountRupees = (payload.amount / 100).toFixed(2); // convert paisa → rupees with 2 dec
      const productinfo = payload.order_id;

      // TODO – fetch customer details if needed; for now use placeholders
      const firstname = "LS Merchant";
      const email = "[email protected]";
      const phone = "9999999999";
      const surl = payload.redirect_url ?? "https://lightspeedpay.com/success";
      const furl = payload.redirect_url ?? "https://lightspeedpay.com/fail";

      // PayU hash generation: sha512(key|txnid|amount|productinfo|firstname|email|||||||salt)
      const hashString = [
        creds.api_key,
        txnid,
        amountRupees,
        productinfo,
        firstname,
        email,
        "", // udf1
        "", // udf2
        "", // udf3
        "", // udf4
        "", // udf5
        "", // empty because double pipe in spec
        "", // empty
        "", // empty
        creds.api_secret, // salt stored in api_secret column
      ].join("|");

      const encoder = new TextEncoder();
      const data = encoder.encode(hashString);
      const hashBuffer = await crypto.subtle.digest("SHA-512", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const formParams = new URLSearchParams({
        key: creds.api_key,
        txnid,
        amount: amountRupees,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
      });

      // Store PayU URL internally but return LightSpeed branded URL to client
      const payuUrl = `https://secure.payu.in/_payment?${formParams.toString()}`;
      const checkout_url = `https://pay.lightspeedpay.com/checkout/${payload.transaction_id}`;
      const gateway_txn_id = txnid; // PayU uses our txnid as reference
      
      // Store the real PayU URL for internal processing
      return { gateway_txn_id, checkout_url, internal_url: payuUrl };
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

    const creds = {
      api_key: dec(gateway.api_key as string),
      api_secret: dec(gateway.api_secret as string),
    };

    // 2. Create order on PSP (stubbed)
    const { gateway_txn_id, checkout_url } = await createOrder(gateway.provider, creds, {
      amount,
      order_id,
      transaction_id,
      redirect_url,
    });

    // 3. Persist transaction details with LightSpeed branding
    await supabase
      .from("client_transactions")
      .update({ 
        gateway_txn_id, 
        status: "pending", 
        gateway_response: { 
          processed_by: "LightSpeed Payment Gateway",
          timestamp: new Date().toISOString(),
          amount: amount,
          currency: "INR"
        }
      })
      .eq("id", transaction_id);

    return { checkout_url };
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_TRANSACTION) || 25 }
);

worker.on("completed", (job) => {
  console.log(`[transaction-processor] Job ${job.id} completed.`);
}); 