/**
 * Add NGME Real Client to Database
 * Purpose: Add NGME as a real client with proper credentials
 * Date: 2025-01-21
 */

const API_BASE_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = 'admin_test_key';

// NGME Real Credentials
const NGME_CLIENT_DATA = {
  id: 'ngme-real-client-2025',
  client_key: 'NGME_REAL_CLIENT_2025',
  client_salt: 'ngme_salt_secure_2025_FRQT0XKLHY',
  company_name: "NGME's bus - NextGen Techno Ventures",
  webhook_url: 'https://api.ngme.in/webhook/payment-update',
  fee_percent: 2.5,
  suspend_threshold: 50000,
  status: 'active',
  rotation_mode: 'round_robin',
  current_rotation_position: 1,
  total_assigned_gateways: 1,
  last_rotation_at: new Date().toISOString(),
  rotation_reset_daily: true
};

async function addNGMERealClient() {
  console.log('🚀 Adding NGME Real Client to Database...');
  
  try {
    console.log('📋 NGME Client Details:', NGME_CLIENT_DATA);
    
    // Add NGME client to database
    const response = await fetch(`${API_BASE_URL}/admin/clients`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(NGME_CLIENT_DATA)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Client creation failed: ${response.status} - ${errorText}`);
    }
    
    const clientResult = await response.json();
    console.log('✅ NGME Client Created Successfully:', clientResult);
    
    // Now assign Easebuzz gateway to NGME client
    console.log('🔗 Assigning Easebuzz Gateway to NGME Client...');
    
    // First, find Easebuzz gateway
    const gatewaysResponse = await fetch(`${API_BASE_URL}/admin/gateways`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!gatewaysResponse.ok) {
      throw new Error('Failed to fetch gateways');
    }
    
    const gatewaysData = await gatewaysResponse.json();
    const easebuzzGateway = gatewaysData.gateways?.find(g => 
      g.provider === 'easebuzz' || 
      g.name?.includes('NextGen') || 
      g.name?.includes('Easebuzz')
    );
    
    if (!easebuzzGateway) {
      throw new Error('Easebuzz gateway not found');
    }
    
    console.log('🎯 Found Easebuzz Gateway:', easebuzzGateway.id);
    
    // Create gateway assignment
    const assignmentData = {
      id: 'ngme-easebuzz-assignment-2025',
      client_id: NGME_CLIENT_DATA.id,
      gateway_id: easebuzzGateway.id,
      rotation_order: 1,
      is_active: true,
      weight: 1.0,
      daily_limit: 500000, // ₹5 lakh daily limit
      daily_usage: 0,
      last_used_at: new Date().toISOString()
    };
    
    const assignmentResponse = await fetch(`${API_BASE_URL}/admin/clients/${NGME_CLIENT_DATA.id}/gateways`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assignmentData)
    });
    
    if (assignmentResponse.ok) {
      const assignmentResult = await assignmentResponse.json();
      console.log('✅ Gateway Assignment Created:', assignmentResult);
    } else {
      console.warn('⚠️ Gateway assignment may have failed, but client is created');
    }
    
    // Create commission wallet
    console.log('💰 Creating Commission Wallet for NGME...');
    const walletData = {
      id: 'wallet-ngme-real',
      client_id: NGME_CLIENT_DATA.id,
      balance_due: 0,
      warn_threshold: 10000,
      wa_last_sent: null
    };
    
    const walletResponse = await fetch(`${API_BASE_URL}/admin/wallets`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(walletData)
    });
    
    if (walletResponse.ok) {
      const walletResult = await walletResponse.json();
      console.log('✅ Commission Wallet Created:', walletResult);
    } else {
      console.warn('⚠️ Wallet creation may have failed');
    }
    
    console.log('🎉 NGME Real Client Setup Complete!');
    console.log('📋 Summary:');
    console.log(`  Client ID: ${NGME_CLIENT_DATA.id}`);
    console.log(`  Client Key: ${NGME_CLIENT_DATA.client_key}`);
    console.log(`  Client Salt: ${NGME_CLIENT_DATA.client_salt}`);
    console.log(`  Company: ${NGME_CLIENT_DATA.company_name}`);
    console.log(`  Gateway: Easebuzz (${easebuzzGateway.id})`);
    console.log(`  Status: Active & Ready for payments`);
    
    return {
      success: true,
      client: clientResult,
      credentials: {
        client_key: NGME_CLIENT_DATA.client_key,
        client_salt: NGME_CLIENT_DATA.client_salt
      },
      gateway_id: easebuzzGateway.id
    };
    
  } catch (error) {
    console.error('❌ Error adding NGME real client:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the setup
addNGMERealClient()
  .then(result => {
    if (result.success) {
      console.log('🎯 RESULT: NGME Real Client Successfully Added!');
      console.log('💡 Now you can use these credentials for real payments:');
      console.log(`   Client Key: ${result.credentials.client_key}`);
      console.log(`   Client Salt: ${result.credentials.client_salt}`);
    } else {
      console.error('❌ FAILED:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Script error:', error);
  }); 