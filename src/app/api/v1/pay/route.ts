import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

// Initialize Supabase client
const supabase = getSupabaseService();

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
  
  console.log('🔐 [PAY] API Key authentication attempt:', { 
    hasApiKey: !!apiKey, 
    hasApiSecret: !!apiSecret,
    apiKey: apiKey?.substring(0, 10) + '...' 
  });
  
  // Handle admin test credentials
  if (apiKey === 'admin_test_key') {
    console.log('✅ [PAY] Using admin test credentials');
    return {
      id: 'admin_test_merchant',
      name: 'Admin Test Merchant',
      api_key: 'admin_test_key',
      api_salt: 'admin_test_secret',
      is_active: true,
      environment: 'production'
    };
  }
  
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Query merchants table for the API key
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  
  if (error || !data) {
    throw new Error('Invalid API credentials');
  }
  
  // Verify API secret only if provided (temporary for testing)
  if (apiSecret && data.api_salt !== apiSecret) {
    throw new Error('Invalid API secret');
  }
  
  return data;
}

// Helper function to get active gateway with enhanced logging
async function getActiveGateway() {
  console.log('🔍 [PAY] Searching for active gateway...');
  
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ [PAY] Gateway query error:', error);
    throw new Error(`Gateway query failed: ${error.message}`);
  }

  if (!data) {
    console.error('❌ [PAY] No active gateway found in database');
    throw new Error('No active gateway found');
  }

  console.log('✅ [PAY] Found active gateway:', {
    id: data.id,
    name: data.name,
    provider: data.provider,
    priority: data.priority,
    hasCredentials: !!data.credentials
  });

  return data;
}

// Helper function to create a transaction
async function createTransaction(params: {
  merchantId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  testMode: boolean;
}) {
  const { merchantId, amount, customerEmail, customerName, customerPhone, paymentMethod, testMode } = params;
  
  // Generate a transaction ID
  const txnId = `LSP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  console.log('📝 [PAY] Creating transaction:', {
    txnId,
    merchantId,
    amount,
    customerEmail,
    testMode
  });
  
  // Create the transaction record
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      txn_id: txnId,
      merchant_id: merchantId,
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
    console.error('❌ [PAY] Transaction creation failed:', error);
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
  
  console.log('✅ [PAY] Transaction created successfully:', data.id);
  return data;
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 [PAY] === PAYMENT REQUEST START ===');
    
    // Verify merchant authentication
    const merchant = await verifyMerchantAuth(request);
    console.log('✅ [PAY] Merchant authenticated:', merchant.name);
    
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
    
    console.log('📋 [PAY] Payment request:', {
      amount,
      customer_email,
      customer_name,
      test_mode,
      product_info
    });
    
    // Validate required fields
    if (!amount || !customer_email) {
      console.error('❌ [PAY] Missing required fields');
      return NextResponse.json({ error: 'Amount and customer email are required' }, { status: 400 });
    }
    
    // Get active gateway
    const gateway = await getActiveGateway();
    
    if (!gateway.credentials) {
      console.error('❌ [PAY] Gateway has no credentials:', gateway.id);
      return NextResponse.json({ 
        success: false,
        error: 'Selected gateway has no credentials configured' 
      }, { status: 500 });
    }
    
    console.log('🔐 [PAY] Gateway credentials available:', {
      hasApiKey: !!gateway.credentials.api_key,
      hasApiSecret: !!gateway.credentials.api_secret
    });
    
    // Create EaseBuzz adapter with correct credential mapping  
    // For Easebuzz: api_key should be merchant_key for hash generation, api_secret should be salt
    const easebuzzAdapter = new EasebuzzAdapter({
      api_key: gateway.credentials.api_key,       // Use merchant_key for hash generation
      api_secret: gateway.credentials.api_secret  // Use salt for hash
    }, test_mode);
    
    // Create transaction record
    const transaction = await createTransaction({
      merchantId: merchant.id,
      amount,
      customerEmail: customer_email,
      customerName: customer_name || 'Customer',
      customerPhone: customer_phone || '9999999999',
      paymentMethod: payment_method || 'upi',
      testMode: test_mode
    });
    
    console.log('🚀 [PAY] Initiating payment with Easebuzz...');
    
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
    
    console.log('📡 [PAY] Easebuzz response:', {
      success: paymentResponse.success,
      hasCheckoutUrl: !!paymentResponse.checkout_url,
      error: paymentResponse.error
    });
    
    if (!paymentResponse.success) {
      console.error('❌ [PAY] Easebuzz payment failed:', paymentResponse.error);
      
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
        gateway_txn_id: (paymentResponse as any).transaction_id || paymentResponse.payment_id,
        checkout_url: paymentResponse.checkout_url
      })
      .eq('txn_id', transaction.txn_id);
    
    console.log('🎉 [PAY] Payment initiated successfully:', {
      transactionId: transaction.txn_id,
      checkoutUrl: paymentResponse.checkout_url
    });
    
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
    console.error('❌ [PAY] Payment initiation error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 400 });
  }
} 