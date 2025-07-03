/**
 * NGME Real Money Payment Test
 * Purpose: Test real payment with NGME's bus credentials
 * Amount: ₹10 (Real Money)
 */

const API_BASE_URL = 'https://web-production-0b337.up.railway.app/api/v1';

// NGME's bus Real Credentials (from your actual account)
const NGME_CREDENTIALS = {
  client_id: '682aefe4e352d264171612c0',  // Real NGME Client ID
  merchant_key: 'FRQT0XKLHY',           // Real NGME Merchant Key
  salt: 'S84LOJ3U0N',                   // Real NGME Salt
  demo_client_key: 'LSP_GAMING_PLATFORM_2025',
  demo_client_salt: 'salt_gaming_secure_2025_xyz789'
};

async function createNGMERealPaymentTest() {
  console.log('💰 Creating NGME Real Money Payment Test (₹10)...');
  
  try {
    // Generate unique order ID for NGME
    const orderId = `NGME_REAL_${Date.now()}`;
    const amount = 10; // ₹10 real money
    
    const paymentData = {
      amount: amount,
      customer_email: 'ngme@nextgentechnoventures.com',
      customer_name: 'NGME Test Customer',
      customer_phone: '9999999999',
      order_id: orderId,
      description: `NGME Real Payment Test - ₹${amount} via Easebuzz`,
      payment_method: 'upi',
      test_mode: false // IMPORTANT: false for real money
    };
    
    console.log('📋 NGME Payment Details:', paymentData);
    console.log('🔐 Using NGME Demo Client Credentials for LightSpeedPay...');
    
    // Create payment request using demo client credentials (for LightSpeedPay system)
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'x-api-key': NGME_CREDENTIALS.demo_client_key,
        'x-api-secret': NGME_CREDENTIALS.demo_client_salt,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log('📡 Payment API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
    }
    
    const paymentResult = await response.json();
    
    if (paymentResult.success && paymentResult.payment_url) {
      console.log('🎉 NGME Real Payment Link Created Successfully!');
      console.log('💳 Payment Details:', {
        payment_url: paymentResult.payment_url,
        transaction_id: paymentResult.transaction_id,
        order_id: orderId,
        amount: `₹${amount}`,
        customer: paymentData.customer_name,
        gateway: 'NGME Easebuzz via LightSpeedPay'
      });
      
      // Show success message and options
      const shouldOpenPayment = confirm(
        `✅ NGME Real Payment Link Created Successfully!\n\n` +
        `💰 Amount: ₹${amount}\n` +
        `🆔 Transaction ID: ${paymentResult.transaction_id}\n` +
        `📱 Order ID: ${orderId}\n` +
        `🚀 Gateway: NGME Easebuzz\n\n` +
        `⚠️ यह REAL MONEY payment है!\n` +
        `क्या आप payment page खोलना चाहते हैं?\n\n` +
        `Payment URL automatically clipboard में copy हो जाएगा।`
      );
      
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(paymentResult.payment_url);
        console.log('📋 Payment URL copied to clipboard');
      }
      
      // Open payment page if user wants
      if (shouldOpenPayment) {
        window.open(paymentResult.payment_url, '_blank');
        console.log('🌐 Payment page opened in new tab');
      }
      
      console.log('🎯 NGME Real Payment Test Complete!');
      console.log('📞 अब आप UPI से ₹10 pay कर सकते हैं');
      console.log('💡 Payment successful होने पर NGME को commission मिलेगा');
      
      return {
        success: true,
        payment_url: paymentResult.payment_url,
        transaction_id: paymentResult.transaction_id,
        order_id: orderId,
        amount: amount,
        gateway: 'NGME Easebuzz'
      };
      
    } else {
      throw new Error(paymentResult.message || 'Payment link creation failed');
    }
    
  } catch (error) {
    console.error('❌ NGME Real Payment Test Failed:', error);
    alert(`❌ Payment Test Failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the real payment test
console.log('🚀 NGME Real Money Payment Test Starting...');
createNGMERealPaymentTest()
  .then(result => {
    if (result.success) {
      console.log('✅ SUCCESS: NGME Real Payment Link Created!');
      console.log('🔗 Payment URL:', result.payment_url);
    } else {
      console.error('❌ FAILED:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Script Error:', error);
  }); 