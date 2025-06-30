#!/usr/bin/env node

/**
 * NextGen Techno Ventures - Easebuzz Gateway Auto-Setup Script
 * This script automatically adds your Easebuzz gateway credentials
 */

const RAILWAY_API_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = 'admin_test_key';

// NextGen Techno Ventures Easebuzz Credentials
const EASEBUZZ_CONFIG = {
  name: "🚀 NextGen Techno - Easebuzz Live Gateway",
  provider: "easebuzz",
  api_key: "D4SS5CFXKV",        // Merchant Key
  api_secret: "HRQ1A10K7J",     // Salt
  environment: "production",     // Live gateway
  priority: 1,                   // Highest priority
  monthly_limit: 5000000,       // 50 lakh monthly limit
  is_active: true,
  webhook_url: `${RAILWAY_API_URL}/callback/easebuzzp`,
  webhook_secret: "lightspeed_easebuzz_webhook_secret"
};

async function addEasebuzzGateway() {
  console.log('🚀 Adding NextGen Techno Ventures Easebuzz Gateway...');
  console.log('📋 Configuration:', {
    provider: EASEBUZZ_CONFIG.provider,
    environment: EASEBUZZ_CONFIG.environment,
    api_key: EASEBUZZ_CONFIG.api_key,
    webhook_url: EASEBUZZ_CONFIG.webhook_url
  });

  try {
    // Use auto-configuration endpoint
    const response = await fetch(`${RAILWAY_API_URL}/admin/gateways/auto-configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        provider: EASEBUZZ_CONFIG.provider,
        name: EASEBUZZ_CONFIG.name,
        credentials: {
          api_key: EASEBUZZ_CONFIG.api_key,
          api_secret: EASEBUZZ_CONFIG.api_secret,
          webhook_secret: EASEBUZZ_CONFIG.webhook_secret
        },
        environment: EASEBUZZ_CONFIG.environment,
        priority: EASEBUZZ_CONFIG.priority,
        monthly_limit: EASEBUZZ_CONFIG.monthly_limit,
        is_active: EASEBUZZ_CONFIG.is_active
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS! Easebuzz Gateway Added Successfully!');
      console.log('🎯 Gateway Details:', result.gateway);
      console.log('');
      console.log('📋 NEXT STEPS:');
      console.log('1. Login to Easebuzz Dashboard: https://dashboard.easebuzz.in/');
      console.log('2. Go to Settings → Webhook Configuration');
      console.log('3. Add this Webhook URL:', result.webhook_url);
      console.log('4. Set Success URL: https://pay.lightspeedpay.com/success');
      console.log('5. Set Failure URL: https://pay.lightspeedpay.com/failed');
      console.log('');
      console.log('🎉 Your Easebuzz gateway is now ready for testing!');
      
      return result;
    } else {
      console.error('❌ Failed to add gateway:', result.message || result.error);
      console.error('Response:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('Full Error:', error);
    return null;
  }
}

async function testGatewayConnection(gatewayId) {
  console.log('🧪 Testing gateway connection...');
  
  try {
    const response = await fetch(`${RAILWAY_API_URL}/admin/gateways/${gatewayId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Gateway test successful!', result);
    } else {
      console.log('⚠️ Gateway test failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function listExistingGateways() {
  console.log('📋 Checking existing gateways...');
  
  try {
    const response = await fetch(`${RAILWAY_API_URL}/admin/gateways`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    const gateways = await response.json();
    
    if (Array.isArray(gateways)) {
      console.log(`📊 Found ${gateways.length} existing gateways:`);
      gateways.forEach((gateway, index) => {
        console.log(`${index + 1}. ${gateway.name} (${gateway.provider}) - ${gateway.is_active ? 'Active' : 'Inactive'}`);
      });
      
      // Check if Easebuzz already exists
      const existingEasebuzz = gateways.find(g => g.provider === 'easebuzz');
      if (existingEasebuzz) {
        console.log('⚠️ Easebuzz gateway already exists:', existingEasebuzz.name);
        return existingEasebuzz;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to list gateways:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 NextGen Techno Ventures - Easebuzz Gateway Setup');
  console.log('=' .repeat(60));
  
  // Step 1: Check existing gateways
  const existingGateway = await listExistingGateways();
  
  if (existingGateway) {
    console.log('✅ Easebuzz gateway already configured!');
    
    // Test existing gateway
    await testGatewayConnection(existingGateway.id);
    return;
  }
  
  // Step 2: Add new Easebuzz gateway
  const result = await addEasebuzzGateway();
  
  if (result && result.gateway) {
    // Step 3: Test the new gateway
    await testGatewayConnection(result.gateway.id);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addEasebuzzGateway, testGatewayConnection, listExistingGateways }; 