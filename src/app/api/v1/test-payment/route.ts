import { NextRequest, NextResponse } from 'next/server';
import { simpleAuth, simpleError, simpleResponse } from '@/lib/simple-auth';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

// Simple test payment endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-PAY] === TEST PAYMENT START ===');
    
    // Simple API key authentication
    const client = await simpleAuth(request);
    if (!client) {
      return simpleError('Invalid API key', 401);
    }

    console.log('✅ [TEST-PAY] Client authenticated:', client.name);

    // Get request body
    const body = await request.json();
    console.log('📋 [TEST-PAY] Request body:', JSON.stringify(body, null, 2));

    // Test with hardcoded Easebuzz credentials
    const testCredentials = {
      api_key: "D4SS5CFXKV",
      api_secret: "HRQ1A10K7J",
      webhook_secret: "optional_webhook_secret"
    };

    console.log('🔧 [TEST-PAY] Using test credentials:', testCredentials);

    try {
      console.log('🔧 [TEST-PAY] Creating EasebuzzAdapter...');
      const adapter = new EasebuzzAdapter(testCredentials, true); // Test mode

      const paymentRequest = {
        amount: body.amount || 1000,
        currency: 'INR',
        order_id: `TEST_${Date.now()}`,
        customer_info: {
          name: body.customer_name || 'Test Customer',
          email: body.customer_email || 'test@example.com',
          phone: body.customer_phone || '9999999999'
        },
        return_url: 'https://pay.lightspeedpay.com/success',
        description: 'Test Payment'
      };

      console.log('🔧 [TEST-PAY] Payment request:', JSON.stringify(paymentRequest, null, 2));
      console.log('🔧 [TEST-PAY] Calling adapter.initiatePayment...');

      const result = await adapter.initiatePayment(paymentRequest);
      
      console.log('🔧 [TEST-PAY] Payment result:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('✅ [TEST-PAY] Payment test successful!');
        return simpleResponse({
          success: true,
          message: 'Test payment successful',
          transaction_id: paymentRequest.order_id,
          checkout_url: result.checkout_url,
          result: result
        });
      } else {
        console.error('❌ [TEST-PAY] Payment test failed:', result.error);
        return simpleError('Test payment failed: ' + result.error, 400);
      }

    } catch (error: any) {
      console.error('❌ [TEST-PAY] Adapter error:', error);
      return simpleError('Test adapter error: ' + (error?.message || 'Unknown error'), 500);
    }

  } catch (error: any) {
    console.error('❌ [TEST-PAY] Request error:', error);
    return simpleError('Test request error: ' + (error?.message || 'Unknown error'), 400);
  }
} 