import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';

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

// Helper function to create a transaction
async function createTransaction(params: {
  merchantId: string;
  amount: number;
  customerEmail: string;
  paymentMethod: string;
}) {
  const { merchantId, amount, customerEmail, paymentMethod } = params;
  
  // Generate a transaction ID
  const txnId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Create the transaction record
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      txn_id: txnId,
      merchant_id: merchantId,
      amount,
      currency: 'INR',
      customer_email: customerEmail,
      customer_phone: '', // This would come from the request in a real implementation
      status: 'PENDING',
      is_sandbox: false,
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
    const { amount, customer_email, payment_method } = await request.json();
    
    // Validate required fields
    if (!amount || !customer_email) {
      return NextResponse.json({ error: 'Amount and customer email are required' }, { status: 400 });
    }
    
    // Create transaction
    const transaction = await createTransaction({
      merchantId: merchant.id,
      amount,
      customerEmail: customer_email,
      paymentMethod: payment_method || 'upi',
    });
    
    // Return response with checkout URL
    return NextResponse.json({
      txn_id: transaction.txn_id,
      checkout_url: `/checkout/${merchant.id}/${transaction.txn_id}`,
      status: 'PENDING'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 