/**
 * 1Payment Real Money Testing Script
 * 
 * यह script आपको real money के साथ 1Payment integration test करने में मदद करेगा।
 * Frontend dashboard के साथ integrate करने के लिए इसे reference के रूप में use करें।
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// 1Payment Production Credentials
const MERCHANT_ID = '66465af54653c90fde1d6d9f';
const CLIENT_KEY = 'G46URJ0A3O';
const CLIENT_SALT = '84OE8CS7PVI';
const API_URL = 'https://1payment.ru/api/v1/bill';

console.log('🎯 1Payment Real Money Testing');
console.log('================================');

/**
 * Generate MD5 Hash for API Authentication
 */
function generateHash(params) {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const hashString = sortedParams + CLIENT_SALT;
  
  console.log('🔐 Hash Generation:');
  console.log('Parameters:', sortedParams);
  console.log('Hash String:', hashString);
  
  const hash = crypto.createHash('md5').update(hashString).digest('hex');
  console.log('Generated Hash:', hash);
  
  return hash;
}

/**
 * Create Real Money Payment
 */
async function createRealMoneyPayment(amount, customerDetails) {
  console.log('\n💰 Creating Real Money Payment...');
  console.log('Amount:', amount);
  console.log('Customer:', customerDetails);
  
  const orderId = `REAL_1PAY_${Date.now()}`;
  
  // Payment Parameters
  const params = {
    merchant_id: MERCHANT_ID,
    amount: amount,
    currency: 'RUB', // 1Payment works with RUB
    order_id: orderId,
    description: `Real Money Test Payment - ${amount} RUB`,
    customer_name: customerDetails.name,
    customer_email: customerDetails.email,
    customer_phone: customerDetails.phone,
    return_url: 'https://lightspeedpay.in/success',
    cancel_url: 'https://lightspeedpay.in/cancel',
    notify_url: 'https://web-production-0b337.up.railway.app/api/v1/webhook/girth1payment'
  };
  
  // Generate Hash
  const hash = generateHash(params);
  params.hash = hash;
  
  console.log('\n📋 Final Parameters:', params);
  
  // Create URL with parameters
  const queryString = querystring.stringify(params);
  const requestUrl = `${API_URL}?${queryString}`;
  
  console.log('\n🌐 Request URL:', requestUrl);
  
  return new Promise((resolve, reject) => {
    const req = https.get(requestUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📡 API Response:');
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve({
              success: true,
              data: response,
              payment_url: response.payment_url || `${API_URL}?${queryString}`,
              order_id: orderId,
              amount: amount
            });
          } catch (e) {
            // If not JSON, might be redirect URL
            resolve({
              success: true,
              data: { raw_response: data },
              payment_url: `${API_URL}?${queryString}`,
              order_id: orderId,
              amount: amount
            });
          }
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });
  });
}

/**
 * Frontend Integration Code
 */
function generateFrontendCode(paymentResult) {
  const frontendCode = `
// 🎯 Frontend Integration Code for 1Payment
// इस code को आपके React component में use करें

const create1PaymentRealMoney = async () => {
  const customerDetails = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1234567890'
  };
  
  const amount = 100; // RUB में amount
  
  try {
    // Backend API call
    const response = await fetch('/api/create-1payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        customer: customerDetails,
        order_id: \`REAL_1PAY_\${Date.now()}\`
      })
    });
    
    if (!response.ok) {
      throw new Error('Payment creation failed');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Success - redirect to payment page
      window.open(result.payment_url, '_blank');
      
      // या same tab में redirect करने के लिए:
      // window.location.href = result.payment_url;
      
      console.log('✅ Payment URL:', result.payment_url);
      console.log('🆔 Order ID:', result.order_id);
      
      return result;
    } else {
      throw new Error(result.error || 'Payment creation failed');
    }
    
  } catch (error) {
    console.error('❌ Payment Error:', error);
    alert('Payment creation failed: ' + error.message);
    throw error;
  }
};

// Button click handler
document.getElementById('pay-button').addEventListener('click', async () => {
  try {
    await create1PaymentRealMoney();
  } catch (error) {
    console.error('Payment failed:', error);
  }
});
`;
  
  return frontendCode;
}

/**
 * Main Test Function
 */
async function runRealMoneyTest() {
  try {
    console.log('\n🚀 Starting Real Money Test...');
    
    // Customer Details
    const customerDetails = {
      name: 'Test Customer',
      email: 'test@lightspeedpay.com',
      phone: '+919999999999'
    };
    
    // Test with small amount (100 RUB ≈ ₹100)
    const amount = 100;
    
    console.log('\n⚠️  WARNING: This is REAL MONEY testing!');
    console.log('Amount:', amount, 'RUB');
    console.log('Make sure you want to proceed with real money transaction.');
    
    // Create payment
    const result = await createRealMoneyPayment(amount, customerDetails);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Payment Link Created!');
      console.log('Payment URL:', result.payment_url);
      console.log('Order ID:', result.order_id);
      console.log('Amount:', result.amount, 'RUB');
      
      console.log('\n📱 Next Steps:');
      console.log('1. Copy the payment URL above');
      console.log('2. Open it in your browser');
      console.log('3. Complete the payment using real payment method');
      console.log('4. Check webhook logs for payment confirmation');
      
      // Generate frontend integration code
      const frontendCode = generateFrontendCode(result);
      console.log('\n💻 Frontend Integration Code:');
      console.log(frontendCode);
      
      // Copy URL to clipboard (if running in browser environment)
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result.payment_url);
        console.log('✅ Payment URL copied to clipboard!');
      }
      
      return result;
    } else {
      console.log('❌ Payment creation failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test Different Payment Amounts
 */
async function testMultipleAmounts() {
  console.log('\n🧪 Testing Multiple Payment Amounts...');
  
  const amounts = [50, 100, 500]; // RUB
  const results = [];
  
  for (const amount of amounts) {
    console.log(`\n💰 Testing ${amount} RUB...`);
    
    try {
      const result = await createRealMoneyPayment(amount, {
        name: `Test Customer ${amount}`,
        email: `test${amount}@lightspeedpay.com`,
        phone: '+919999999999'
      });
      
      if (result.success) {
        results.push(result);
        console.log(`✅ ${amount} RUB payment link created`);
      }
    } catch (error) {
      console.error(`❌ ${amount} RUB failed:`, error.message);
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.amount} RUB - ${result.payment_url}`);
  });
  
  return results;
}

/**
 * Safety Guidelines for Real Money Testing
 */
function showSafetyGuidelines() {
  console.log('\n🛡️  REAL MONEY TESTING SAFETY GUIDELINES');
  console.log('=========================================');
  console.log('1. 🔍 Start with SMALL amounts (50-100 RUB)');
  console.log('2. 🧪 Test in controlled environment first');
  console.log('3. 📝 Keep track of all transaction IDs');
  console.log('4. 🔄 Verify webhook responses');
  console.log('5. 💳 Use test payment methods when available');
  console.log('6. 🎯 Test success, failure, and timeout scenarios');
  console.log('7. 📱 Test on different devices and browsers');
  console.log('8. 🔐 Monitor security and fraud detection');
  console.log('9. 📊 Track conversion rates and user experience');
  console.log('10. 🚨 Have rollback plan ready');
  console.log('\n⚠️  IMPORTANT: This uses REAL MONEY. Proceed with caution!');
}

// Export functions for use in other files
module.exports = {
  createRealMoneyPayment,
  generateHash,
  runRealMoneyTest,
  testMultipleAmounts,
  showSafetyGuidelines
};

// Run test if called directly
if (require.main === module) {
  showSafetyGuidelines();
  
  // Uncomment below line to run the test
  // runRealMoneyTest();
  
  console.log('\n🎯 To run the test, uncomment the line above or call:');
  console.log('node test-1payment-real-money.js');
} 