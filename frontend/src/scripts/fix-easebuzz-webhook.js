// EaseBuzz Webhook URL Auto-Fix Script
// Run this to automatically update the webhook URL for EaseBuzz gateway

const API_BASE_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = 'admin_test_key';

async function fixEasebuzzWebhookURL() {
  console.log('🔧 Starting EaseBuzz Webhook URL Fix...');
  
  try {
    // Step 1: Get all gateways
    console.log('📋 Fetching all gateways...');
    const response = await fetch(`${API_BASE_URL}/admin/gateways`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gateways: ${response.status}`);
    }
    
    const data = await response.json();
    const gateways = data.gateways || data;
    
    console.log(`✅ Found ${gateways.length} gateways`);
    
    // Step 2: Find EaseBuzz gateway
    const easebuzzGateway = gateways.find(g => 
      g.provider === 'easebuzz' || 
      g.name.toLowerCase().includes('easebuzz') ||
      g.code === 'easebuzz_primary'
    );
    
    if (!easebuzzGateway) {
      console.error('❌ No EaseBuzz gateway found!');
      return false;
    }
    
    console.log('🎯 Found EaseBuzz Gateway:', {
      id: easebuzzGateway.id,
      name: easebuzzGateway.name,
      provider: easebuzzGateway.provider,
      current_webhook: easebuzzGateway.webhook_url
    });
    
    // Step 3: Update with correct webhook URL
    const correctWebhookURL = 'https://web-production-0b337.up.railway.app/api/v1/callback/easebuzz';
    
    console.log('📡 Updating webhook URL to:', correctWebhookURL);
    
    const updateResponse = await fetch(`${API_BASE_URL}/admin/gateways/${easebuzzGateway.id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: easebuzzGateway.name,
        provider: 'easebuzz',
        webhook_url: correctWebhookURL,
        api_key: 'D4SS5CFXKV',
        api_secret: 'HRQ1A10K7J',
        environment: 'production',
        priority: 1,
        is_active: true,
        monthly_limit: 1000000
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorData}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ Update successful:', updateResult);
    
    // Step 4: Verify the update
    console.log('🔍 Verifying update...');
    const verifyResponse = await fetch(`${API_BASE_URL}/admin/gateways`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyData = await verifyResponse.json();
    const updatedGateway = (verifyData.gateways || verifyData).find(g => g.id === easebuzzGateway.id);
    
    if (updatedGateway && updatedGateway.webhook_url === correctWebhookURL) {
      console.log('🎉 SUCCESS! Webhook URL updated successfully');
      console.log('✅ Current webhook URL:', updatedGateway.webhook_url);
      
      // Show instructions for EaseBuzz dashboard
      console.log('\n📋 NEXT STEPS - EaseBuzz Dashboard Configuration:');
      console.log('1. Login to EaseBuzz Merchant Dashboard');
      console.log('2. Go to Settings > Webhooks');
      console.log(`3. Add this URL: ${correctWebhookURL}`);
      console.log('4. Enable Transaction Webhook');
      console.log('5. Save settings');
      console.log('\n🚀 Your system is now ready for real money testing!');
      
      return true;
    } else {
      console.error('❌ Verification failed - webhook URL not updated properly');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error fixing webhook URL:', error);
    return false;
  }
}

// Run the fix
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Running in browser...');
  fixEasebuzzWebhookURL().then(success => {
    if (success) {
      alert('✅ EaseBuzz webhook URL fixed successfully! Check console for details.');
    } else {
      alert('❌ Failed to fix webhook URL. Check console for errors.');
    }
  });
} else {
  // Node.js environment
  fixEasebuzzWebhookURL().then(success => {
    process.exit(success ? 0 : 1);
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fixEasebuzzWebhookURL };
} 