// Test 1Payment API with correct parameter format
const crypto = require('crypto');
const fetch = require('node-fetch');

// Test credentials from the conversation
const credentials = {
  partner_id: '66465af54653c90fde1d6d9f',
  project_id: 'G46URJ0A3O',
  api_secret: '84OE8CS7PVI'
};

function generateHash(params, apiSecret) {
  // 1Payment hash format: md5("init_payment" + params_alphabetical + api_secret)
  const sortedKeys = Object.keys(params).sort();
  const paramsString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const hashString = `init_payment${paramsString}${apiSecret}`;
  
  console.log('🔐 Hash generation:', {
    method: 'init_payment',
    params: paramsString,
    secret: apiSecret?.substring(0, 4) + '***',
    hash_input: `init_payment${paramsString}[SECRET]`
  });
  
  return crypto.createHash('md5').update(hashString, 'utf8').digest('hex');
}

async function test1PaymentAPI() {
  console.log('🧪 Testing 1Payment API with correct parameter format...');
  
  try {
    // Payment parameters
    const paymentParams = {
      partner_id: credentials.partner_id,
      project_id: credentials.project_id,
      payment_type: 'card',
      amount: '1', // ₹1 test
      description: 'LightSpeedPay Test Payment',
      user_data: `LSP_${Date.now()}`,
      return_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return'
    };

    // Generate hash
    const hash = generateHash(paymentParams, credentials.api_secret);
    
    // Build URL with parameters
    const apiUrl = 'https://api.1payment.com/init_payment';
    const urlParams = new URLSearchParams({
      ...paymentParams,
      sign: hash
    });
    
    const finalUrl = `${apiUrl}?${urlParams.toString()}`;
    
    console.log('🌐 API URL:', finalUrl.replace(/sign=[^&]+/, 'sign=***'));
    console.log('📝 Parameters:', {
      ...paymentParams,
      sign: hash.substring(0, 8) + '***'
    });
    
    // Make API call
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LightSpeedPay/1.0'
      }
    });

    const responseText = await response.text();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📊 Response Body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ 1Payment API Success:', data);
        
        if (data.payment_url || data.redirect_url) {
          console.log('🎉 SUCCESS: Payment URL generated!');
          console.log('💰 Payment URL:', data.payment_url || data.redirect_url);
        } else {
          console.log('⚠️ Response received but no payment URL found');
        }
      } catch (parseError) {
        console.log('⚠️ Non-JSON response received:', responseText);
      }
    } else {
      console.log('❌ 1Payment API Error:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('📋 Error Details:', errorData);
        
        if (errorData.error_code) {
          console.log(`🔍 Error Code: ${errorData.error_code}`);
          console.log(`📝 Error Message: ${errorData.error || errorData.error_description || 'Unknown error'}`);
        }
      } catch (parseError) {
        console.log('❌ Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
  }
}

// Run the test
test1PaymentAPI(); 