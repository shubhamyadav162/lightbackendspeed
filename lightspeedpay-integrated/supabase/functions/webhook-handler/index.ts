// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: webhook-handler (Phase 1 Task 2)
// Verifies gateway webhook, enqueues processing job.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Queue } from "https://esm.sh/bullmq@3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const REDIS_URL = Deno.env.get("REDIS_URL")!;
const queue = new Queue("webhook-processing", { connection: { url: REDIS_URL } });

// Supabase client to fetch gateway secrets for signature verification
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyRazorpay(body: string, headerSig: string | null) {
  if (!headerSig) return false;

  // For simplicity, resolve a single shared webhook secret via env var first
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return true; // no secret configured ⇒ skip (non-blocking)

  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(body));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return headerSig === expected;
}

/**
 * Attempt to verify webhook signature based on detectable provider.
 * Currently supports Razorpay when header "x-razorpay-signature" is present.
 * Returns true if verification passes OR verification skipped (unknown provider).
 */
async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const hdr = req.headers;
  if (hdr.has("x-razorpay-signature")) {
    return await verifyRazorpay(rawBody, hdr.get("x-razorpay-signature"));
  }

  // TODO: Implement PayU hash verification when docs finalised
  return true; // fallback – allow other providers through for now
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const clientKey = req.url.split("/").pop();

  // Read raw body for signature verification (cannot use req.json yet)
  const rawBody = await req.text();

  // Signature verification (provider-specific)
  const verified = await verifySignature(req, rawBody);
  if (!verified) {
    return new Response("INVALID_SIGNATURE", { status: 401 });
  }

  // Parse body JSON after verification
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {
    return new Response("Invalid JSON", { status: 400 });
  }

  await queue.add("webhook", {
    client_key: clientKey,
    webhook_data: payload,
  });

  return new Response("OK", { status: 200 });
}); 