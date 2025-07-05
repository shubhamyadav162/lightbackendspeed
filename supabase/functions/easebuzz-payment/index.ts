// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: easebuzz-payment
// EaseBuzz payment processing with LightSpeed wrapper integration

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// LightSpeed Wrapper utilities
class LightSpeedWrapper {
  static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LSP_${timestamp}_${random}`;
  }

  static generateCheckoutUrl(txnId: string): string {
    return `https://web-production-0b337.up.railway.app/checkout/${txnId}`;
  }

  static sanitizePaymentResponse(originalResponse: any, transactionId: string, amount: number) {
    return {
      success: originalResponse.success,
      transaction_id: transactionId,
      checkout_url: originalResponse.checkout_url || this.generateCheckoutUrl(transactionId),
      status: originalResponse.status || 'pending',
      amount: amount,
      currency: 'INR',
      message: originalResponse.message || originalResponse.error,
      gateway: 'LightSpeed Payment Gateway'
    };
  }

  static sanitizeMessage(message: string): string {
    if (!message) return '';
    
    // Replace gateway specific terms with LightSpeed branding
    return message
      .replace(/easebuzz/gi, 'LightSpeed')
      .replace(/razorpay/gi, 'LightSpeed')
      .replace(/payu/gi, 'LightSpeed')
      .replace(/gateway/gi, 'Payment Gateway');
  }
}

// EaseBuzz utilities
async function generateEasebuzzHash(data: any, salt: string): Promise<string> {
  const hashString = [
    data.key,
    data.txnid,
    data.amount,
    data.productinfo,
    data.firstname,
    data.email || '',
    '', '', '', '', '', '', '', // UDF fields (empty)
    salt
  ].join('|');

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface EasebuzzPaymentRequest {
  amount: number;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  order_id?: string;
  description?: string;
  test_mode?: boolean;
  client_key: string;
  client_salt: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-api-secret',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  let body: EasebuzzPaymentRequest;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid JSON',
      gateway: 'LightSpeed Payment Gateway'
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Validate client credentials
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, client_key, client_salt')
      .eq('client_key', body.client_key)
      .single();

    if (clientError || !client || client.client_salt !== body.client_salt) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid client credentials',
        gateway: 'LightSpeed Payment Gateway'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Get active EaseBuzz gateway
    const { data: gateway, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('provider', 'easebuzz')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (gatewayError || !gateway) {
      return new Response(JSON.stringify({
        success: false,
        message: 'EaseBuzz gateway not available',
        gateway: 'LightSpeed Payment Gateway'
      }), { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Generate LightSpeed transaction ID
    const lightspeedTxnId = LightSpeedWrapper.generateTransactionId();
    const amount = (body.amount / 100).toFixed(2); // Convert paisa to rupees

    // 4. Prepare EaseBuzz payment data
    const easebuzzCredentials = gateway.credentials as any;
    const paymentData = {
      key: easebuzzCredentials.api_key,
      txnid: lightspeedTxnId,
      amount: amount,
      productinfo: body.description || 'LightSpeed Payment',
      firstname: body.customer_name || 'Customer',
      email: body.customer_email,
      phone: body.customer_phone || '9999999999',
      surl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp',
      furl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp'
    };

    // 5. Generate hash for EaseBuzz
    const hash = await generateEasebuzzHash(paymentData, easebuzzCredentials.api_secret);
    paymentData.hash = hash;

    // 6. Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('client_transactions')
      .insert({
        id: lightspeedTxnId,
        client_id: client.id,
        gateway_id: gateway.id,
        amount: body.amount,
        status: 'created',
        gateway_txn_id: lightspeedTxnId,
        customer_email: body.customer_email,
        customer_name: body.customer_name || 'Customer',
        customer_phone: body.customer_phone || '9999999999',
        order_id: body.order_id || lightspeedTxnId
      })
      .select()
      .single();

    if (txnError) {
      console.error('Transaction creation error:', txnError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to create transaction',
        gateway: 'LightSpeed Payment Gateway'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. Make API call to EaseBuzz
    const apiUrl = body.test_mode 
      ? 'https://testpay.easebuzz.in/payment/initiateLink'
      : 'https://pay.easebuzz.in/payment/initiateLink';

    const easebuzzResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentData).toString()
    });

    const result = await easebuzzResponse.json();

    // 8. Handle EaseBuzz response
    if (result.status === 1) {
      // Success - update transaction status
      await supabase
        .from('client_transactions')
        .update({ 
          status: 'pending',
          gateway_response: result
        })
        .eq('id', lightspeedTxnId);

      // Return LightSpeed branded success response
      return new Response(JSON.stringify(
        LightSpeedWrapper.sanitizePaymentResponse({
          success: true,
          checkout_url: result.data,
          status: 'pending'
        }, lightspeedTxnId, body.amount)
      ), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Failure - update transaction status
      await supabase
        .from('client_transactions')
        .update({ 
          status: 'failed',
          gateway_response: result
        })
        .eq('id', lightspeedTxnId);

      // Return LightSpeed branded error response
      return new Response(JSON.stringify(
        LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          message: LightSpeedWrapper.sanitizeMessage(result.data || 'Payment initiation failed'),
          status: 'failed'
        }, lightspeedTxnId, body.amount)
      ), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('EaseBuzz payment error:', error);
    
    const errorTxnId = LightSpeedWrapper.generateTransactionId();
    return new Response(JSON.stringify(
      LightSpeedWrapper.sanitizePaymentResponse({
        success: false,
        message: 'Payment processing failed',
        status: 'failed'
      }, errorTxnId, body.amount || 0)
    ), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 