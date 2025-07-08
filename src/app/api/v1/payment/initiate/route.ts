import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';
import { createHmac } from 'crypto';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Helper function to verify client signature
async function verifyClientSignature(
  clientKey: string, 
  orderId: string, 
  amount: number, 
  signature: string, 
  clientSalt: string
): Promise<boolean> {
  const message = `${clientKey}|${orderId}|${amount}`;
  const expectedSignature = createHmac('sha256', clientSalt)
    .update(message)
    .digest('hex');
  
  return expectedSignature === signature;
}

// Helper function to generate a transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LSP_${timestamp}_${random}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 [PAYMENT INITIATE] === REQUEST START ===');
    const supabase = getSupabaseService();
    
    // Parse request body
    const body = await request.json();
    const { amount, order_id, client_key, signature, redirect_url } = body;
    
    // Validate required fields
    if (!amount || !order_id || !client_key || !signature) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 400 });
    }
    
    // Fetch client by key
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, fee_percent, suspend_threshold, client_salt')
      .eq('client_key', client_key)
      .single();
    
    if (clientError || !client) {
      console.error('❌ [PAYMENT INITIATE] Client not found:', clientError);
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 404 });
    }
    
    // Verify signature
    const isValidSignature = await verifyClientSignature(
      client_key,
      order_id,
      amount,
      signature,
      client.client_salt
    );
    
    if (!isValidSignature) {
      console.error('❌ [PAYMENT INITIATE] Invalid signature');
      return NextResponse.json({
        success: false,
        message: 'Authentication failed',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 401 });
    }
    
    // Check commission balance vs suspend_threshold
    const { data: wallet, error: walletErr } = await supabase
      .from('commission_wallets')
      .select('balance_due')
      .eq('client_id', client.id)
      .single();
    
    if (walletErr) {
      console.error('[PAYMENT INITIATE] Wallet fetch error:', walletErr);
    }
    
    if (wallet && wallet.balance_due > (client.suspend_threshold ?? 10000)) {
      return NextResponse.json({
        success: false,
        message: 'Account suspended due to outstanding balance',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 403 });
    }
    
    // Select gateway using priority
    const { data: gateway, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();
    
    if (gatewayError || !gateway) {
      console.error('❌ [PAYMENT INITIATE] No active gateway found:', gatewayError);
      return NextResponse.json({
        success: false,
        message: 'Service temporarily unavailable',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 503 });
    }
    
    // Generate transaction ID
    const transactionId = generateTransactionId();
    
    // Insert transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('client_transactions')
      .insert({
        order_id: order_id,
        client_id: client.id,
        gateway_id: gateway.id,
        amount: amount,
        status: 'PENDING'
      })
      .select('id, status')
      .single();
    
    if (txnError) {
      console.error('❌ [PAYMENT INITIATE] Transaction creation failed:', txnError);
      return NextResponse.json({
        success: false,
        message: 'Service temporarily unavailable',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 500 });
    }
    
    // Generate checkout URL
    const checkoutUrl = `https://web-production-0b337.up.railway.app/checkout/${transaction.id}`;
    
    console.log('✅ [PAYMENT INITIATE] Transaction created successfully:', transaction.id);
    
    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      checkout_url: checkoutUrl,
      status: transaction.status,
      amount: amount,
      currency: 'INR',
      gateway: 'LightSpeed Payment Gateway'
    });
    
  } catch (error: any) {
    console.error('❌ [PAYMENT INITIATE] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
      gateway: 'LightSpeed Payment Gateway'
    }, { status: 500 });
  }
} 