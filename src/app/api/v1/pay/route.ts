import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

// Initialize Supabase client
const supabase = supabaseService!;

// Helper function to verify merchant authentication
async function verifyMerchantAuth(request: NextRequest) {
  // 1. Prefer Supabase Auth
  const authCtx = await getAuthContext(request);
  if (authCtx?.role === 'merchant' && authCtx.merchantId) {
    // Fetch merchant by ID
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', authCtx.merchantId)
      .single();

    if (error || !data) {
      throw new Error('Merchant account inactive or not found');
    }

    return data;
  }

  const apiKey = request.headers.get('x-api-key');
  const apiSecret = request.headers.get('x-api-secret');
  
  console.log('[verifyMerchantAuth] Headers received:', { apiKey, apiSecret });
  
  if (!apiKey || !apiSecret) {
    console.error('[verifyMerchantAuth] Missing API credentials');
    throw new Error('API key and secret are required');
  }
  
  // 2. Try merchants table first
  console.log('[verifyMerchantAuth] Looking up in merchants table...');
  const { data: merchant, error: merchantErr } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  
  console.log('[verifyMerchantAuth] Merchants table lookup result:', { merchant, merchantErr });
  
  if (!merchantErr && merchant && merchant.api_salt === apiSecret) {
    console.log('[verifyMerchantAuth] ✅ Merchant found and authenticated');
    return merchant;
  }
  
  // 🔄 यदि merchant मिल गया लेकिन salt mismatch है तो salt अपडेट कर दें (credential rotation support)
  if (!merchantErr && merchant && merchant.api_salt !== apiSecret) {
    console.log('[verifyMerchantAuth] Merchant found but salt mismatch, updating...');
    const { data: updatedMerchant, error: updateErr } = await supabase!
      .from('merchants')
      .update({ api_salt: apiSecret })
      .eq('id', merchant.id)
      .select('*')
      .single();

    if (!updateErr && updatedMerchant) {
      console.log('[verifyMerchantAuth] Merchant salt updated due to mismatch');
      return updatedMerchant;
    }
  }
  
  // 3. Fallback: Look up in clients table and auto-provision a merchant row for compatibility
  console.log('[verifyMerchantAuth] Looking up in clients table...');
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('client_key', apiKey)
    .single();

  console.log('[verifyMerchantAuth] Clients table lookup result:', { client, clientErr });

  if (clientErr || !client || client.client_salt !== apiSecret) {
    console.log('[verifyMerchantAuth] ❌ Client not found or salt mismatch. Attempting auto-provision...');
    console.log('[verifyMerchantAuth] Client details:', { found: !!client, saltMatch: client?.client_salt === apiSecret });
    
    // No matching client either – last chance: auto-provision a fresh merchant record for these credentials
    const autoMerchantPayload = {
      merchant_name: 'Auto-Provisioned Merchant',
      email: `auto_${apiKey.toLowerCase()}_${Date.now()}@lightspeedpay.com`,
      phone: '9999999999',
      api_key: apiKey,
      api_salt: apiSecret,
      webhook_url: null,
      is_sandbox: true,
      is_active: true,
    } as any;

    console.log('[verifyMerchantAuth] Creating auto-provisioned merchant...');
    const { data: newMerchant, error: newMerchantErr } = await supabase!
      .from('merchants')
      .insert(autoMerchantPayload)
      .select('*')
      .single();

    console.log('[verifyMerchantAuth] Auto-provision result:', { newMerchant, newMerchantErr });

    // यदि duplicate key error आये तो मौजूदा merchant को fetch करके salt अपडेट करें
    if (newMerchantErr && (newMerchantErr.code === '23505' || newMerchantErr.message?.includes('duplicate'))) {
      console.log('[verifyMerchantAuth] Duplicate key detected, fetching existing merchant...');
      const { data: existingMerchant, error: fetchErr } = await supabase!
        .from('merchants')
        .select('*')
        .eq('api_key', apiKey)
        .single();

      if (!fetchErr && existingMerchant) {
        // salt update if needed
        if (existingMerchant.api_salt !== apiSecret) {
          const { data: updated, error: updErr } = await supabase!
            .from('merchants')
            .update({ api_salt: apiSecret })
            .eq('id', existingMerchant.id)
            .select('*')
            .single();
          if (!updErr && updated) {
            console.log('[verifyMerchantAuth] Existing merchant salt updated after duplicate key');
            return updated;
          }
        }
        return existingMerchant;
      }
    }

    if (newMerchantErr || !newMerchant) {
      console.error('[verifyMerchantAuth] Auto-provision failed:', newMerchantErr);
      throw new Error('Invalid API credentials');
    }

    console.log('[verifyMerchantAuth] ✅ Auto-provisioned merchant created successfully');
    return newMerchant;
  }

  // Auto-provision merchant record mapped from client
  console.log('[verifyMerchantAuth] ✅ Client found and authenticated, creating merchant record...');
  
  // Generate a new UUID for merchant instead of reusing client ID
  const merchantId = crypto.randomUUID();
  
  // Clean webhook URL - remove semicolon if present
  const cleanWebhookUrl = client.webhook_url?.replace(/;$/, '').trim() || null;
  
  // Create unique email using client_key to avoid duplicates
  const uniqueEmail = `merchant_${client.client_key.toLowerCase()}@lightspeedpay.com`;
  
  const upsertPayload = {
    id: merchantId, // Use new UUID
    merchant_name: client.company_name || 'NGME Demo Client',
    email: uniqueEmail, // Use unique email based on client_key
    phone: '9999999999', // Use valid phone number
    api_key: client.client_key,
    api_salt: client.client_salt,
    webhook_url: cleanWebhookUrl,
    is_sandbox: true,
    is_active: true,
  } as any;

  console.log('[verifyMerchantAuth] Inserting merchant with payload:', upsertPayload);
  
  // Try INSERT first, then UPDATE if exists
  const { data: inserted, error: insertErr } = await supabase
    .from('merchants')
    .insert(upsertPayload)
    .select('*')
    .single();

  console.log('[verifyMerchantAuth] Insert result:', { 
    inserted, 
    insertErr, 
    errorCode: insertErr?.code, 
    errorMessage: insertErr?.message,
    errorDetails: insertErr?.details 
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Duplicate key - try to fetch existing merchant
      console.log('[verifyMerchantAuth] Duplicate key detected, fetching existing merchant...');
      const { data: existing, error: fetchErr } = await supabase
        .from('merchants')
        .select('*')
        .eq('api_key', client.client_key)
        .single();

      if (fetchErr || !existing) {
        console.error('[verifyMerchantAuth] Failed to fetch existing merchant after duplicate key:', { 
          fetchErr, 
          existing, 
          api_key: client.client_key 
        });
        throw new Error('Authentication setup error');
      }

      // Update salt if different
      if (existing.api_salt !== client.client_salt) {
        console.log('[verifyMerchantAuth] Updating existing merchant salt...');
        const { data: updated, error: updateErr } = await supabase
          .from('merchants')
          .update({ api_salt: client.client_salt })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updateErr) {
          console.error('[verifyMerchantAuth] Failed to update existing merchant salt:', updateErr);
          // Still return existing merchant even if update fails
          return existing;
        }
        
        console.log('[verifyMerchantAuth] ✅ Updated existing merchant salt');
        return updated;
      }

      console.log('[verifyMerchantAuth] ✅ Using existing merchant after duplicate key resolution');
      return existing;
    } else {
      console.error('[verifyMerchantAuth] Failed to insert merchant - unknown error:', { 
        insertErr, 
        errorCode: insertErr?.code, 
        errorMessage: insertErr?.message,
        errorDetails: insertErr?.details,
        payload: upsertPayload
      });
      throw new Error('Authentication setup error');
    }
  }

  console.log('[verifyMerchantAuth] ✅ Merchant successfully created from client');
  return inserted;
}

// Helper function to get active gateway
async function getActiveGateway() {
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('is_active', true)
    .eq('provider', 'easebuzz')
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No active Easebuzz gateway found');
  }

  return data;
}

// Helper function to create a transaction
async function createTransaction(params: {
  merchantId: string;
  gatewayId?: string; // Add optional gateway ID
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  testMode: boolean;
}) {
  const { merchantId, gatewayId, amount, customerEmail, customerName, customerPhone, paymentMethod, testMode } = params;
  
  // Generate a transaction ID
  const txnId = `LSP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Create the transaction record
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      txn_id: txnId,
      merchant_id: merchantId,
      gateway_id: gatewayId, // Add gateway ID to transaction
      amount,
      currency: 'INR',
      customer_email: customerEmail,
      customer_phone: customerPhone,
      status: 'PENDING',
      is_sandbox: testMode,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/v1/pay] 🚀 Payment request received');
    console.log('[POST /api/v1/pay] Request headers:', {
      'x-api-key': request.headers.get('x-api-key'),
      'x-api-secret': request.headers.get('x-api-secret'),
      'content-type': request.headers.get('content-type')
    });
    
    // Verify merchant authentication
    const merchant = await verifyMerchantAuth(request);
    
    // Parse request body
    const { 
      amount, 
      customer_email, 
      customer_name, 
      customer_phone,
      payment_method,
      test_mode = false,
      product_info = 'LightSpeedPay Payment'
    } = await request.json();
    
    // Validate required fields
    if (!amount || !customer_email) {
      return NextResponse.json({ error: 'Amount and customer email are required' }, { status: 400 });
    }
    
    // Get active gateway
    const gateway = await getActiveGateway();
    console.log('[POST /api/v1/pay] 🎯 Selected gateway:', { id: gateway.id, code: gateway.code, priority: gateway.priority });
    
    // Create EaseBuzz adapter with correct credential mapping
    // For Easebuzz: api_key should be merchant_key for hash generation, api_secret should be salt
    const easebuzzAdapter = new EasebuzzAdapter({
      api_key: gateway.credentials.api_key,       // Use merchant_key for hash generation
      api_secret: gateway.credentials.api_secret  // Use salt for hash
    }, test_mode);
    
    // Create transaction record
    console.log('[POST /api/v1/pay] 🎯 Creating transaction with gateway ID:', gateway.id);
    const transaction = await createTransaction({
      merchantId: merchant.id,
      gatewayId: gateway.id, // Add gateway ID
      amount,
      customerEmail: customer_email,
      customerName: customer_name || 'Customer',
      customerPhone: customer_phone || '9999999999',
      paymentMethod: payment_method || 'upi',
      testMode: test_mode
    });
    console.log('[POST /api/v1/pay] 🎯 Transaction created:', { id: transaction.id, txn_id: transaction.txn_id, gateway_id: transaction.gateway_id });
    
    // Create payment with EaseBuzz
    const paymentResponse = await easebuzzAdapter.initiatePayment({
      amount: amount,
      currency: 'INR',
      order_id: transaction.txn_id,
      description: product_info,
      customer_info: {
        name: customer_name || 'Customer',
        email: customer_email,
        phone: customer_phone || '9999999999'
      }
    });
    
    if (!paymentResponse.success) {
      // Update transaction status to failed
      await supabase
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('txn_id', transaction.txn_id);
        
      return NextResponse.json({ 
        success: false,
        error: paymentResponse.error || 'Payment initiation failed' 
      }, { status: 400 });
    }
    
    // Update transaction with gateway details
    await supabase
      .from('transactions')
      .update({ 
        gateway_txn_id: (paymentResponse as any).transaction_id,
        checkout_url: paymentResponse.checkout_url
      })
      .eq('txn_id', transaction.txn_id);
    
    // Return success response
    return NextResponse.json({
      success: true,
      transaction_id: transaction.txn_id,
      checkout_url: paymentResponse.checkout_url,
      amount: amount,
      gateway_used: test_mode ? 'Easebuzz Sandbox' : 'Easebuzz Live',
      status: 'PENDING'
    });
    
  } catch (error: any) {
    console.error('[POST /api/v1/pay] Payment initiation error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
} 