// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: webhook-handler (Refactored)
// Universal webhook handler for all payment gateways.
// This function validates the incoming webhook and enqueues it for processing.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Queue } from "https://esm.sh/bullmq@3";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const webhookQueue = new Queue("webhook-processing", { connection: { url: REDIS_URL } });

// --- Helper Functions ---

async function verifyEasebuzzWebhook(payload, salt: string): Promise<boolean> {
  if (!payload || !salt) return false;
  const { status, txnid, amount, email, firstname, productinfo, key, hash: receivedHash } = payload;
  const hashString = `${salt}|${status}|||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(hashString);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return receivedHash === expectedHash;
}

async function verifyRazorpayWebhook(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!rawBody || !signature || !secret) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expectedSignature = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature)).map(b => b.toString(16).padStart(2, "0")).join('');
    return expectedSignatureHex === signature;
  } catch (error) {
    console.error("Error verifying Razorpay webhook:", error);
    return false;
  }
}

// --- Main Server Logic ---

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
  };

  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // We need the raw body for signature verification, so we read it as text first.
  const rawBody = await req.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return new Response("Invalid JSON payload", { status: 400, headers: corsHeaders });
  }

  const razorpaySignature = req.headers.get("X-Razorpay-Signature");
  
  let gatewayProvider: 'razorpay' | 'easebuzz' | 'payu' | 'unknown' = 'unknown';
  let isValid = false;
  let clientTxnId: string | null = null;
  
  // 1. Determine the gateway provider and verify signature
  if (razorpaySignature) {
    gatewayProvider = 'razorpay';
    const orderId = payload?.payload?.payment?.entity?.order_id;
    if (orderId) {
      const { data: txn } = await supabase
        .from('client_transactions')
        .select('gateway_id')
        .eq('gateway_txn_id', orderId) // Assuming gateway_txn_id stores the Razorpay order_id
        .single();

      if (txn?.gateway_id) {
        const { data: gateway } = await supabase
          .from('payment_gateways')
          .select('credentials')
          .eq('id', txn.gateway_id)
          .single();
        
        const secret = gateway?.credentials?.webhook_secret;
        if (secret) {
          isValid = await verifyRazorpayWebhook(rawBody, razorpaySignature, secret);
          clientTxnId = payload?.payload?.payment?.entity?.notes?.lightspeed_txn_id ?? null;
        }
      }
    }
  } else if (payload.txnid && payload.key && payload.hash) {
    gatewayProvider = 'easebuzz';
    clientTxnId = payload.txnid;
    const { data: gateway } = await supabase
      .from("payment_gateways")
      .select("credentials")
      .eq("credentials->>api_key", payload.key)
      .single();
      
    if (gateway?.credentials?.api_secret) {
      isValid = await verifyEasebuzzWebhook(payload, gateway.credentials.api_secret);
    }
  }
  // Add PayU logic here if needed

  // 2. If signature is invalid, reject the request.
  if (!isValid) {
    return new Response("Webhook signature verification failed.", { status: 401, headers: corsHeaders });
  }
  
  // 3. Enqueue the validated webhook for processing by a worker.
  await webhookQueue.add("processWebhook", {
    provider: gatewayProvider,
    payload: payload,
    lightspeed_txn_id: clientTxnId, // Pass our internal transaction ID
  });

  // 4. Respond immediately to the gateway.
  return new Response(JSON.stringify({ status: "queued" }), { status: 200, headers: corsHeaders });
});

async function processEasebuzzWebhook(payload: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const {
    status,
    txnid,
    amount,
    email,
    firstname,
    productinfo,
    hash: receivedHash,
    key,
    easepayid
  } = payload;

  if (!txnid || !receivedHash) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid webhook payload',
      gateway: 'LightSpeed Payment Gateway'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Get EaseBuzz gateway configuration
  const { data: gateway, error: gatewayError } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('provider', 'easebuzz')
    .eq('is_active', true)
    .single();

  if (gatewayError || !gateway) {
    console.error('❌ EaseBuzz gateway not found or inactive');
    return new Response(JSON.stringify({
      success: false,
      message: 'Gateway not configured',
      gateway: 'LightSpeed Payment Gateway'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Verify hash
  const credentials = gateway.credentials as any;
  const isValidHash = await verifyEasebuzzWebhook(payload, credentials.api_secret);

  if (!isValidHash) {
    console.error('❌ Hash verification failed');
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication failed',
      gateway: 'LightSpeed Payment Gateway'
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  console.log('✅ Hash verification successful');

  // Find transaction
  const { data: transaction, error: txnError } = await supabase
    .from('client_transactions')
    .select('*')
    .eq('id', txnid)
    .single();

  if (txnError || !transaction) {
    console.error('❌ Transaction not found:', txnid);
    return new Response(JSON.stringify({
      success: false,
      message: 'Transaction not found',
      gateway: 'LightSpeed Payment Gateway'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // Map status
  let systemStatus = 'pending';
  switch (status?.toLowerCase()) {
    case 'success':
      systemStatus = 'paid';
      break;
    case 'failed':
    case 'failure':
      systemStatus = 'failed';
      break;
    case 'usercancel':
      systemStatus = 'cancelled';
      break;
    default:
      systemStatus = 'pending';
  }

  // Update transaction
  const { error: updateError } = await supabase
    .from('client_transactions')
    .update({
      status: systemStatus,
      gateway_txn_id: easepayid || txnid,
      gateway_response: payload,
      updated_at: new Date().toISOString()
    })
    .eq('id', txnid);

  if (updateError) {
    console.error('❌ Failed to update transaction:', updateError);
    return new Response(JSON.stringify({
      success: false,
      message: 'Update failed',
      gateway: 'LightSpeed Payment Gateway'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }

  console.log(`✅ Transaction ${txnid} updated to status: ${systemStatus}`);

  // Calculate commission if payment successful
  if (systemStatus === 'paid') {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('fee_percent')
        .eq('id', transaction.client_id)
        .single();

      if (client && client.fee_percent) {
        const commissionAmount = Math.round((transaction.amount * client.fee_percent) / 100);
        
        await supabase
          .from('commission_ledger')
          .insert({
            transaction_id: txnid,
            client_id: transaction.client_id,
            amount: commissionAmount,
            fee_percent: client.fee_percent,
            status: 'recorded'
          });

        console.log(`✅ Commission recorded for transaction ${txnid}`);
      }
    } catch (commissionError) {
      console.error('⚠️ Commission calculation failed:', commissionError);
    }
  }

  // Send client webhook notification if configured
  if (transaction.client_webhook_url) {
    try {
      const clientWebhookPayload = LightSpeedWrapper.sanitizeWebhookResponse(
        payload, 
        txnid, 
        transaction.amount
      );

      await fetch(transaction.client_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LightSpeed-Signature': 'webhook-signature'
        },
        body: JSON.stringify(clientWebhookPayload)
      });

      console.log('✅ Client webhook notification sent');
    } catch (webhookError) {
      console.error('⚠️ Client webhook notification failed:', webhookError);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Webhook processed successfully',
    gateway: 'LightSpeed Payment Gateway'
  }), {
    headers: corsHeaders
  });
}

async function processRazorpayWebhook(payload: any) {
  // Similar implementation for Razorpay
  // This can be implemented later
  return new Response(JSON.stringify({
    success: true,
    message: 'Razorpay webhook received',
    gateway: 'LightSpeed Payment Gateway'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 