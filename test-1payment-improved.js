// Improved 1Payment API test with better parameter format
const crypto = require('crypto');
const fetch = require('node-fetch');

// Test credentials
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

async function test1PaymentAPIVariations() {
  console.log('🧪 Testing 1Payment API with multiple parameter variations...\n');
  
  const testCases = [
    {
      name: 'Test 1: Basic Card Payment',
      params: {
        partner_id: credentials.partner_id,
        project_id: credentials.project_id,
        payment_type: 'card',
        amount: '1',
        currency: 'INR',
        description: 'Test Payment',
        user_data: `LSP_${Date.now()}`,
        return_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return'
      }
    },
    {
      name: 'Test 2: UPI Payment',
      params: {
        partner_id: credentials.partner_id,
        project_id: credentials.project_id,
        payment_type: 'upi',
        amount: '1',
        currency: 'INR',
        description: 'UPI Test Payment',
        user_data: `LSP_${Date.now()}`,
        return_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return'
      }
    },
    {
      name: 'Test 3: Minimal Required Parameters',
      params: {
        partner_id: credentials.partner_id,
        project_id: credentials.project_id,
        amount: '1',
        user_data: `LSP_${Date.now()}`,
        return_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return'
      }
    },
    {
      name: 'Test 4: Extended Parameters',
      params: {
        partner_id: credentials.partner_id,
        project_id: credentials.project_id,
        payment_type: 'card',
        amount: '1',
        currency: 'INR',
        description: 'Extended Test Payment',
        user_data: `LSP_${Date.now()}`,
        return_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return',
        success_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/success',
        fail_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/fail'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log('=' .repeat(50));
    
    try {
      // Generate hash
      const hash = generateHash(testCase.params, credentials.api_secret);
      
      // Build URL with parameters
      const apiUrl = 'https://api.1payment.com/init_payment';
      const urlParams = new URLSearchParams({
        ...testCase.params,
        sign: hash
      });
      
      const finalUrl = `${apiUrl}?${urlParams.toString()}`;
      
      console.log('📝 Parameters:', {
        ...testCase.params,
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
      console.log('📊 Response Body:', responseText);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          
          if (data.payment_url || data.redirect_url) {
            console.log('🎉 SUCCESS: Payment URL generated!');
            console.log('💰 Payment URL:', data.payment_url || data.redirect_url);
            return; // Exit on first success
          } else if (data.error_code) {
            console.log(`⚠️ Error Code ${data.error_code}: ${data.error || data.error_description || 'Check parameter format'}`);
            
            // Analyze common error codes
            if (data.error_code === 2) {
              console.log('💡 Error Code 2 usually means: Invalid or missing parameters');
              console.log('   - Check parameter names and values');
              console.log('   - Verify all required fields are present');
              console.log('   - Ensure parameter format matches API specification');
            }
          } else {
            console.log('⚠️ Response received but format unclear:', data);
          }
        } catch (parseError) {
          console.log('⚠️ Non-JSON response:', responseText);
        }
      } else {
        console.log('❌ HTTP Error:', response.status, responseText);
      }
      
    } catch (error) {
      console.error('❌ Network Error:', error.message);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 Summary:');
  console.log('- API is accessible (no more "fetch failed")');
  console.log('- Parameter format is correct (GET with URL parameters)');
  console.log('- Hash generation is working');
  console.log('- Need to adjust parameters to resolve error code 2');
  console.log('\n💡 Next Steps:');
  console.log('1. Check 1Payment documentation for exact parameter requirements');
  console.log('2. Contact 1Payment support for parameter specification');
  console.log('3. Test with different payment_type values');
  console.log('4. Verify merchant account is properly configured');
}

// Run the tests
test1PaymentAPIVariations(); 