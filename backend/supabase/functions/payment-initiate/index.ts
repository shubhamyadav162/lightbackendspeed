// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: payment-initiate (Phase 1 Task 2)
// Validates client signature, selects gateway, enqueues job, returns txn id.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Queue } from "https://esm.sh/bullmq@3";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Environment variables injected via Supabase secrets
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!; // "redis://host:port"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const txnQueue = new Queue("transaction-processing", { connection: { url: REDIS_URL } });

interface PaymentRequest {
  amount: number;
  order_id: string;
  client_key: string;
  signature: string; // Hex-encoded HMAC SHA256(client_key|order_id|amount)
  redirect_url?: string;
}

async function computeHmac(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: PaymentRequest;
  try {
    body = await req.json();
  } catch (_) {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 1. Fetch client by key so we can validate signature using stored salt
  const { data: client } = await supabase
    .from("clients")
    .select("id, fee_percent, suspend_threshold, client_salt")
    .eq("client_key", body.client_key)
    .single();

  if (!client) {
    return new Response("Client not found", { status: 404 });
  }

  // 2. Validate HMAC signature
  const expectedSig = await computeHmac(
    `${body.client_key}|${body.order_id}|${body.amount}`,
    client.client_salt,
  );

  if (expectedSig !== body.signature) {
    return new Response("Invalid signature", { status: 401 });
  }

  // 3. Check commission balance vs suspend_threshold
  const { data: wallet, error: walletErr } = await supabase
    .from("commission_wallets")
    .select("balance_due")
    .eq("client_id", client.id)
    .single();

  if (walletErr) {
    console.error("[payment-initiate] wallet fetch error", walletErr);
  }

  if (wallet && wallet.balance_due > (client.suspend_threshold ?? 10000)) {
    return new Response("SUSPENDED_THRESHOLD", { status: 403 });
  }

  // 4. Select gateway via RPC (runs algorithm inside DB & updates current_volume atomically)
  const { data: gateways, error: gwErr } = await supabase.rpc("select_gateway_for_amount", {
    p_amount: body.amount,
  });

  if (gwErr) {
    console.error("[payment-initiate] select_gateway_for_amount error", gwErr);
    return new Response("SERVICE_UNAVAILABLE", { status: 503 });
  }

  if (!gateways || gateways.length === 0) {
    return new Response("SERVICE_UNAVAILABLE", { status: 503 });
  }

  const gateway = gateways[0];

  // 5. Insert transaction & enqueue job
  const { data: txn, error } = await supabase
    .from("client_transactions")
    .insert({
      order_id: body.order_id,
      client_id: client.id,
      gateway_id: gateway.id,
      amount: body.amount,
    })
    .select()
    .single();

  if (error) {
    return new Response("DB_ERROR", { status: 500 });
  }

  await txnQueue.add("process", {
    client_id: client.id,
    gateway_id: gateway.id,
    amount: body.amount,
    order_id: body.order_id,
    transaction_id: txn.id,
    redirect_url: body.redirect_url ?? null,
  });

  return new Response(JSON.stringify({ transaction_id: txn.id, status: "created" }), {
    headers: { "Content-Type": "application/json" },
  });
}); 