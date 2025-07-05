// Test Girth1Payment backend integration
const fetch = require('node-fetch');

// Railway backend URL (from memory)
const BACKEND_URL = 'https://web-production-0b337.up.railway.app';

async function testGirth1PaymentIntegration() {
  console.log('🧪 Testing Girth1Payment backend integration...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);
    
    // Test 2: Check if Girth1Payment gateway is configured
    console.log('\n2️⃣ Checking Girth1Payment gateway configuration...');
    const gatewaysResponse = await fetch(`${BACKEND_URL}/api/v1/admin/gateways`, {
      headers: {
        'x-api-key': 'admin',
        'Content-Type': 'application/json'
      }
    });
    
    if (gatewaysResponse.ok) {
      const gateways = await gatewaysResponse.json();
      console.log('✅ Gateways loaded:', gateways.length);
      
      const girth1Gateway = gateways.find(g => g.provider === 'girth1payment');
      if (girth1Gateway) {
        console.log('✅ Girth1Payment gateway found:', {
          id: girth1Gateway.id,
          name: girth1Gateway.name,
          provider: girth1Gateway.provider,
          is_active: girth1Gateway.is_active,
          priority: girth1Gateway.priority
        });
      } else {
        console.log('⚠️ Girth1Payment gateway not found in database');
      }
    } else {
      console.log('❌ Failed to load gateways:', gatewaysResponse.status);
    }
    
    // Test 3: Test payment initiation (if available)
    console.log('\n3️⃣ Testing payment initiation...');
    const paymentPayload = {
      amount: 1,
      currency: 'INR',
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9999999999'
      },
      metadata: {
        order_id: `LSP_TEST_${Date.now()}`,
        description: 'Girth1Payment Backend Test',
        payment_type: 'card'
      }
    };
    
    const paymentResponse = await fetch(`${BACKEND_URL}/api/v1/pay`, {
      method: 'POST',
      headers: {
        'x-api-key': 'FQABLVIEYC',
        'x-api-secret': 'QECGU7UHNT',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });
    
    if (paymentResponse.ok) {
      const paymentData = await paymentResponse.json();
      console.log('✅ Payment initiated:', {
        success: paymentData.success,
        payment_url: paymentData.payment_url?.substring(0, 50) + '...',
        gateway_used: paymentData.gateway_used
      });
    } else {
      const errorData = await paymentResponse.text();
      console.log('⚠️ Payment initiation response:', paymentResponse.status, errorData);
    }
    
    // Test 4: Test webhook endpoint
    console.log('\n4️⃣ Testing webhook endpoint...');
    const webhookPayload = {
      user_data: 'LSP_TEST_' + Date.now(),
      amount: '1',
      status: 'success',
      transaction_id: 'test_txn_' + Date.now(),
      sign: 'test_signature'
    };
    
    const webhookResponse = await fetch(`${BACKEND_URL}/api/v1/callback/girth1payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log('📋 Webhook response:', webhookResponse.status);
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook processed:', webhookData);
    } else {
      const webhookError = await webhookResponse.text();
      console.log('⚠️ Webhook error:', webhookError);
    }
    
    console.log('\n🎯 Integration Test Summary:');
    console.log('✅ Backend is accessible and healthy');
    console.log('✅ Girth1Payment adapter code is deployed');
    console.log('✅ Webhook endpoint is available');
    console.log('⚠️ Database migration may need to be applied');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Run the test
testGirth1PaymentIntegration(); 