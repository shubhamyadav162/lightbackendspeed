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

// ✅ ENHANCED: NGME Test Credentials Fallback
const NGME_TEST_CREDENTIALS = {
  api_key: "FQABLVIEYC",
  api_secret: "QECGU7UHNT",
  client_id: "682d9154e352d26417059640"
};

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
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-api-secret, Authorization',
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
    console.log('✅ Request received:', { 
      amount: body.amount, 
      client_key: body.client_key, 
      customer_email: body.customer_email 
    });

    // ✅ ENHANCED: Parameter Validation
    if (!body.amount || body.amount <= 0) {
      throw new Error('Invalid amount: Amount must be greater than 0');
    }
    if (!body.customer_email || !/\S+@\S+\.\S+/.test(body.customer_email)) {
      throw new Error('Invalid email: Valid email address required');
    }
    if (!body.client_key || !body.client_salt) {
      throw new Error('Invalid credentials: Client key and salt required');
    }

  } catch (error) {
    console.error('❌ Request validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Parameter validation failed: ${error.message}`,
      gateway: 'LightSpeed Payment Gateway'
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // ✅ ENHANCED: Try database client lookup with fallback
    console.log('🔍 Step 1: Validating client credentials...');
    let client = null;
    
    try {
      const { data: dbClient, error: clientError } = await supabase
        .from('clients')
        .select('id, client_key, client_salt')
        .eq('client_key', body.client_key)
        .single();

      if (!clientError && dbClient && dbClient.client_salt === body.client_salt) {
        client = dbClient;
        console.log('✅ Client validated from database:', client.id);
      }
    } catch (dbError) {
      console.warn('⚠️ Database client lookup failed, checking fallback credentials...');
    }

    // ✅ ENHANCED: Fallback to NGME test credentials
    if (!client && body.client_key === NGME_TEST_CREDENTIALS.api_key && body.client_salt === NGME_TEST_CREDENTIALS.api_secret) {
      client = {
        id: 'ngme_test_client',
        client_key: NGME_TEST_CREDENTIALS.api_key,
        client_salt: NGME_TEST_CREDENTIALS.api_secret
      };
      console.log('✅ Client validated using NGME test credentials');
    }

    if (!client) {
      console.error('❌ Client credentials invalid');
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid client credentials',
        gateway: 'LightSpeed Payment Gateway'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ ENHANCED: Try database gateway lookup with fallback
    console.log('🔍 Step 2: Getting EaseBuzz gateway...');
    let gateway = null;
    
    try {
      const { data: dbGateway, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('provider', 'easebuzz')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (!gatewayError && dbGateway) {
        gateway = dbGateway;
        console.log('✅ Gateway found in database:', gateway.id);
      }
    } catch (dbError) {
      console.warn('⚠️ Database gateway lookup failed, using fallback configuration...');
    }

    // ✅ ENHANCED: Fallback gateway configuration
    if (!gateway) {
      gateway = {
        id: 'ngme_fallback_gateway',
        provider: 'easebuzz',
        credentials: {
          api_key: NGME_TEST_CREDENTIALS.api_key,
          api_secret: NGME_TEST_CREDENTIALS.api_secret
        },
        is_active: true,
        priority: 1
      };
      console.log('✅ Using fallback gateway configuration');
    }

    // 3. Generate LightSpeed transaction ID
    const lightspeedTxnId = LightSpeedWrapper.generateTransactionId();
    const amount = (body.amount / 100).toFixed(2); // Convert paisa to rupees
    console.log('✅ Generated transaction ID:', lightspeedTxnId, 'Amount:', amount);

    // 4. Prepare EaseBuzz payment data
    console.log('🔍 Step 3: Preparing EaseBuzz payment data...');
    const easebuzzCredentials = gateway.credentials as any;
    console.log('✅ Gateway credentials loaded:', { 
      api_key: easebuzzCredentials.api_key, 
      has_secret: !!easebuzzCredentials.api_secret 
    });

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
    console.log('🔍 Step 4: Generating EaseBuzz hash...');
    const hash = await generateEasebuzzHash(paymentData, easebuzzCredentials.api_secret);
    paymentData.hash = hash;
    console.log('✅ Hash generated successfully');

    // ✅ ENHANCED: Try transaction creation with graceful handling
    console.log('🔍 Step 5: Creating transaction record...');
    let transaction = null;
    
    try {
      const { data: txnData, error: txnError } = await supabase
        .from('client_transactions')
        .insert({
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

      if (!txnError && txnData) {
        transaction = txnData;
        console.log('✅ Transaction created in database:', transaction.id);
      }
    } catch (txnError) {
      console.warn('⚠️ Database transaction creation failed, continuing with payment...');
      transaction = {
        id: 'fallback_' + lightspeedTxnId,
        gateway_txn_id: lightspeedTxnId
      };
    }

    // 7. Make API call to EaseBuzz
    console.log('🔍 Step 6: Making EaseBuzz API call...');
    const apiUrl = body.test_mode 
      ? 'https://testpay.easebuzz.in/payment/initiateLink'
      : 'https://pay.easebuzz.in/payment/initiateLink';

    console.log('✅ API URL:', apiUrl);

    const easebuzzResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentData).toString()
    });

    const result = await easebuzzResponse.json();
    console.log('✅ EaseBuzz response:', result);

    // 8. Handle EaseBuzz response
    if (result.status === 1) {
      console.log('✅ Payment successful, updating transaction...');
      
      // Try to update transaction if it exists in database
      if (transaction && transaction.id && !transaction.id.startsWith('fallback_')) {
        try {
          await supabase
            .from('client_transactions')
            .update({ 
              status: 'pending',
              gateway_response: result
            })
            .eq('id', transaction.id);
        } catch (updateError) {
          console.warn('⚠️ Transaction update failed:', updateError);
        }
      }

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
      console.error('❌ EaseBuzz payment failed:', result);
      console.error('❌ EaseBuzz API Response Details:', {
        status: result.status,
        data: result.data,
        error: result.error,
        message: result.message,
        paymentData: {
          key: paymentData.key,
          amount: paymentData.amount,
          email: paymentData.email,
          phone: paymentData.phone
        }
      });
      
      // Try to update transaction if it exists in database
      if (transaction && transaction.id && !transaction.id.startsWith('fallback_')) {
        try {
          await supabase
            .from('client_transactions')
            .update({ 
              status: 'failed',
              gateway_response: result
            })
            .eq('id', transaction.id);
        } catch (updateError) {
          console.warn('⚠️ Transaction update failed:', updateError);
        }
      }

      // ✅ ENHANCED: More detailed error message for debugging
      const errorMessage = result.data || result.error || result.message || 'Payment initiation failed';
      const detailedMessage = `EaseBuzz API Error: ${errorMessage}. This might be due to test credentials or API configuration. Please check EaseBuzz dashboard settings.`;

      // Return LightSpeed branded error response
      return new Response(JSON.stringify(
        LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          message: detailedMessage,
          status: 'failed',
          debug_info: {
            easebuzz_response: result,
            credentials_used: {
              api_key: paymentData.key,
              amount: paymentData.amount,
              test_mode: body.test_mode
            }
          }
        }, lightspeedTxnId, body.amount)
      ), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
    
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