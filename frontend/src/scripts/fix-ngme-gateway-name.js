/**
 * Fix NGME Gateway Name in Database
 * Purpose: Update NextGen Techno Ventures name to NGME's bus
 * Date: 2025-01-21
 */

const API_BASE_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = 'admin_test_key';

async function updateNGMEGatewayName() {
  console.log('🔧 Fixing NGME Gateway Name in Database...');
  
  try {
    // 1. First get all gateways to find the Easebuzz one
    console.log('📡 Fetching all gateways...');
    const gatewaysResponse = await fetch(`${API_BASE_URL}/admin/gateways`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!gatewaysResponse.ok) {
      throw new Error(`Failed to fetch gateways: ${gatewaysResponse.status}`);
    }
    
    const gatewaysData = await gatewaysResponse.json();
    console.log('✅ Gateways fetched:', gatewaysData.gateways?.length);
    
    // 2. Find Easebuzz gateway
    const easebuzzGateway = gatewaysData.gateways?.find(g => 
      g.provider === 'easebuzz' || 
      g.name.includes('NextGen') || 
      g.name.includes('Easebuzz')
    );
    
    if (!easebuzzGateway) {
      throw new Error('Easebuzz gateway not found');
    }
    
    console.log('🎯 Found Easebuzz Gateway:', {
      id: easebuzzGateway.id,
      currentName: easebuzzGateway.name,
      provider: easebuzzGateway.provider
    });
    
    // 3. Update gateway name to NGME's bus
    console.log('🔧 Updating gateway name to NGME\'s bus...');
    const updateResponse = await fetch(`${API_BASE_URL}/admin/gateways/${easebuzzGateway.id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "🚀 NGME's bus, payment gateway",
        provider: "easebuzz",
        credentials: easebuzzGateway.credentials,
        webhook_url: easebuzzGateway.webhook_url,
        environment: easebuzzGateway.environment,
        priority: 1,
        is_active: true
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ Gateway name updated successfully!', updateResult);
    
    console.log('🎉 NGME Gateway Name Fix Complete!');
    console.log('📋 Summary:');
    console.log(`  Gateway ID: ${easebuzzGateway.id}`);
    console.log(`  Old Name: ${easebuzzGateway.name}`);
    console.log(`  New Name: 🚀 NGME's bus, payment gateway`);
    console.log(`  Provider: easebuzz`);
    console.log(`  Status: Active`);
    
    return {
      success: true,
      gatewayId: easebuzzGateway.id,
      oldName: easebuzzGateway.name,
      newName: "🚀 NGME's bus, payment gateway"
    };
    
  } catch (error) {
    console.error('❌ Error fixing NGME gateway name:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the fix
updateNGMEGatewayName()
  .then(result => {
    if (result.success) {
      console.log('🎯 RESULT: NGME Gateway name successfully updated!');
      console.log('🔄 Please refresh your dashboard to see the changes.');
    } else {
      console.error('❌ FAILED:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Script error:', error);
  }); 