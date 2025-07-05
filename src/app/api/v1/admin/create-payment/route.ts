import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Girth1PaymentAdapter } from '../../../../../lib/gateways/girth1payment-adapter';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.jh5ZT1vYwcQl1DmSCKcBZqKd9rg9CKHB1dHJkRr0Zw4'
);

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Admin Create Payment Request Received');
    
    // Get request body
    const body = await request.json();
    const { 
      gateway_provider, 
      amount, 
      currency = 'INR', 
      customer_name, 
      customer_email, 
      customer_phone, 
      order_id, 
      description,
      return_url,
      webhook_url
    } = body;
    
    console.log('📋 Payment Request Details:', {
      gateway_provider,
      amount,
      currency,
      customer_name,
      customer_email,
      order_id
    });
    
    // Validate required fields
    if (!gateway_provider || !amount || !customer_email || !order_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: gateway_provider, amount, customer_email, order_id'
      }, { status: 400 });
    }
    
    // Handle 1Payment (Girth1Payment) specifically
    if (gateway_provider === 'girth1payment') {
      console.log('🚀 Processing 1Payment request...');
      
      // Get Girth1Payment gateway configuration from database
      const { data: gateway, error: gatewayError } = await supabase
        .from('gateways')
        .select('*')
        .eq('provider', 'girth1payment')
        .eq('is_active', true)
        .single();
      
      if (gatewayError || !gateway) {
        console.error('❌ Girth1Payment gateway not found:', gatewayError);
        return NextResponse.json({
          success: false,
          error: 'Girth1Payment gateway not configured or inactive'
        }, { status: 404 });
      }
      
      console.log('✅ Found Girth1Payment gateway:', gateway.name);
      
      // Initialize 1Payment adapter
      const adapter = new Girth1PaymentAdapter(gateway.credentials);
      
      // Create payment using adapter's initiatePayment method
      const paymentResult = await adapter.initiatePayment(
        amount,
        currency,
        order_id,
        {
          name: customer_name,
          email: customer_email,
          phone: customer_phone
        },
        {
          description: description || `Payment for ${order_id}`,
          return_url: return_url || 'https://lightspeedpay.in/success',
          success_url: return_url || 'https://lightspeedpay.in/success',
          fail_url: 'https://lightspeedpay.in/failed'
        }
      );
      
      if (paymentResult.success) {
        console.log('🎉 1Payment created successfully!');
        
        // Store transaction in database
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            id: paymentResult.payment_id,
            gateway_id: gateway.id,
            amount: amount,
            currency: currency,
            status: 'pending',
            order_id: order_id,
            customer_email: customer_email,
            customer_name: customer_name,
            customer_phone: customer_phone,
            gateway_transaction_id: paymentResult.payment_id,
            metadata: {
              payment_url: paymentResult.payment_url,
              gateway_provider: 'girth1payment',
              description: description
            }
          })
          .select()
          .single();
        
        if (transactionError) {
          console.error('⚠️ Failed to store transaction:', transactionError);
          // Continue anyway as payment was created
        } else {
          console.log('✅ Transaction stored in database');
        }
        
        return NextResponse.json({
          success: true,
          payment_url: paymentResult.payment_url,
          transaction_id: paymentResult.payment_id,
          gateway_transaction_id: paymentResult.payment_id,
          order_id: order_id,
          amount: amount,
          currency: currency,
          status: 'pending',
          message: '1Payment link created successfully'
        });
        
      } else {
        console.error('❌ 1Payment creation failed:', paymentResult.error);
        return NextResponse.json({
          success: false,
          error: paymentResult.error || '1Payment creation failed'
        }, { status: 400 });
      }
    }
    
    // Handle other gateway providers
    return NextResponse.json({
      success: false,
      error: `Gateway provider '${gateway_provider}' not supported yet`
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Admin Create Payment Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Admin Create Payment API',
    version: '1.0.0',
    supported_gateways: ['girth1payment'],
    endpoints: {
      POST: '/api/v1/admin/create-payment'
    }
  });
} 