// Real Money Payment Test Script for EaseBuzz
// Use this to quickly create a real payment link for testing

const API_BASE_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = 'admin_test_key';

async function createRealPaymentTest(amount = 10, customerName = 'Test User') {
  console.log(`💰 Creating real payment test for ₹${amount}...`);
  
  try {
    // Generate unique order ID
    const orderId = `TEST_${Date.now()}`;
    const customerEmail = 'test@lightspeedpay.com';
    const customerPhone = '9999999999';
    
    console.log('📋 Payment Details:', {
      amount,
      orderId,
      customerName,
      customerEmail,
      customerPhone
    });
    
    // Create payment request
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_id: orderId,
        description: `Real Money Test Payment - ₹${amount}`,
        payment_method: 'upi',
        test_mode: false // Set to false for real money
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
    }
    
    const paymentData = await response.json();
    
    if (paymentData.success && paymentData.payment_url) {
      console.log('🎉 Payment link created successfully!');
      console.log('💳 Payment URL:', paymentData.payment_url);
      console.log('🆔 Transaction ID:', paymentData.transaction_id);
      console.log('📱 Order ID:', orderId);
      
      // Instructions for user
      console.log('\n📋 TESTING INSTRUCTIONS:');
      console.log('1. Open the payment URL in browser');
      console.log('2. Choose UPI payment method');
      console.log('3. Scan QR code with any UPI app');
      console.log('4. Complete payment with your UPI PIN');
      console.log('5. Check transaction status in dashboard');
      
      // Return for browser usage
      if (typeof window !== 'undefined') {
        const shouldOpen = confirm(
          `✅ Real payment link created for ₹${amount}!\n\n` +
          `Transaction ID: ${paymentData.transaction_id}\n` +
          `Order ID: ${orderId}\n\n` +
          `Open payment page now?`
        );
        
        if (shouldOpen) {
          window.open(paymentData.payment_url, '_blank');
        }
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(paymentData.payment_url);
          console.log('📋 Payment URL copied to clipboard!');
        }
      }
      
      return {
        success: true,
        payment_url: paymentData.payment_url,
        transaction_id: paymentData.transaction_id,
        order_id: orderId,
        amount: amount
      };
      
    } else {
      throw new Error(paymentData.message || 'Payment creation failed');
    }
    
  } catch (error) {
    console.error('❌ Error creating payment test:', error);
    
    if (typeof window !== 'undefined') {
      alert(`❌ Payment test failed: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick test functions for different amounts
async function test10Rupees() {
  return await createRealPaymentTest(10, 'Test User - 10₹');
}

async function test50Rupees() {
  return await createRealPaymentTest(50, 'Test User - 50₹');
}

async function test100Rupees() {
  return await createRealPaymentTest(100, 'Test User - 100₹');
}

// Browser usage
if (typeof window !== 'undefined') {
  console.log('🌐 Real Payment Test Script Loaded!');
  console.log('💡 Available functions:');
  console.log('   - createRealPaymentTest(amount, customerName)');
  console.log('   - test10Rupees()');
  console.log('   - test50Rupees()');
  console.log('   - test100Rupees()');
  
  // Make functions globally available
  window.createRealPaymentTest = createRealPaymentTest;
  window.test10Rupees = test10Rupees;
  window.test50Rupees = test50Rupees;
  window.test100Rupees = test100Rupees;
}

// Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createRealPaymentTest,
    test10Rupees,
    test50Rupees,
    test100Rupees
  };
}

// Auto-run for quick testing (uncomment to use)
// createRealPaymentTest(10, 'Auto Test User'); 