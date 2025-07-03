// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: webhook-handler
// Universal webhook handler for all payment gateways with LightSpeed wrapper

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// LightSpeed Wrapper utilities
class LightSpeedWrapper {
  static sanitizeWebhookResponse(originalPayload: any, transactionId: string, amount: number) {
    return {
      transaction_id: transactionId,
      status: originalPayload.status,
      amount: amount,
      currency: 'INR',
      gateway: 'LightSpeed Payment Gateway',
      processed_at: new Date().toISOString()
    };
  }

  static sanitizeMessage(message: string): string {
    if (!message) return '';
    
    return message
      .replace(/easebuzz/gi, 'LightSpeed')
      .replace(/razorpay/gi, 'LightSpeed')
      .replace(/payu/gi, 'LightSpeed');
  }
}

// EaseBuzz webhook verification
async function verifyEasebuzzWebhook(payload: any, salt: string): Promise<boolean> {
  const {
    status,
    txnid,
    amount,
    email,
    firstname,
    productinfo,
    hash: receivedHash,
    key
  } = payload;

  // EaseBuzz reverse hash format
  const hashString = [
    salt,
    status || '',
    '', '', '', '', '', '', '', // UDF fields (empty in reverse)
    email || '',
    firstname || '',
    productinfo || '',
    amount || '',
    txnid || '',
    key || ''
  ].join('|');

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
  const expectedHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return receivedHash === expectedHash;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const lastSegment = pathSegments.pop() || ''; // success, failed, or client_key
  const secondLastSegment = pathSegments.pop() || ''; // payu or callback

  let clientKey = '';
  let webhookType = '';

  // Handle new /api/v1/callback/payu/success|failed structure
  if (secondLastSegment === 'payu' && (lastSegment === 'success' || lastSegment === 'failed')) {
    webhookType = lastSegment;
    // For this structure, we need to extract client_key from the payload if possible
    // or assume a generic handler. For now, we'll log it.
    console.log(`Received PayU webhook of type: ${webhookType}`);
  } else {
    // Handle existing /webhook/:client_key structure
    clientKey = lastSegment;
  }

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
    // If clientKey is not in the URL, try to get it from the payload
    if (!clientKey && payload?.client_key) {
      clientKey = payload.client_key;
    }
  } catch (_) {
    return new Response("Invalid JSON", { status: 400 });
  }

  await queue.add("webhook", {
    client_key: clientKey,
    webhook_data: payload,
    webhook_type: webhookType // Pass type to the worker
  });

  return new Response("OK", { status: 200 });
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