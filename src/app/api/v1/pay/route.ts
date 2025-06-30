import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

// Initialize Supabase client
const supabase = supabaseService;

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
  
  if (!apiKey || !apiSecret) {
    throw new Error('API key and secret are required');
  }
  
  // Query merchants table for the API key and secret
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  
  if (error || !data) {
    throw new Error('Invalid API credentials');
  }
  
  // Verify API secret (in a real implementation, this would be more secure)
  if (data.api_salt !== apiSecret) {
    throw new Error('Invalid API credentials');
  }
  
  return data;
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
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
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
    
    // Create EaseBuzz adapter
    const easebuzzAdapter = new EasebuzzAdapter({
      api_key: gateway.credentials.api_key,
      api_secret: gateway.credentials.api_secret
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
    
    // Create payment with EaseBuzz
    const paymentResponse = await easebuzzAdapter.initiatePayment({
      amount: amount,
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
        gateway_txn_id: paymentResponse.transaction_id,
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
    console.error('Payment initiation error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 400 });
  }
} 