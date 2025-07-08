const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set in the environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Connecting to Supabase to fetch gateways...');
  
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('name, provider, is_active, priority, credentials');

    if (error) {
      console.error('❌ Supabase fetch error:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('🟡 No payment gateways found in the database.');
      return;
    }

    console.log(`✅ Found ${data.length} gateways. Analyzing credentials...`);
    console.log('---');

    const readyGateways = [];
    const incompleteGateways = [];

    data.forEach(gw => {
      const hasApiKey = !!gw.credentials?.api_key;
      const hasApiSecret = !!gw.credentials?.api_secret;
      
      const gatewayStatus = {
        name: gw.name,
        provider: gw.provider,
        is_active: gw.is_active,
        priority: gw.priority,
        has_api_key: hasApiKey,
        has_api_secret: hasApiSecret,
        is_ready: hasApiKey && hasApiSecret && gw.is_active,
      };

      if (gatewayStatus.is_ready) {
        readyGateways.push(gatewayStatus);
      } else {
        incompleteGateways.push(gatewayStatus);
      }
    });

    if (readyGateways.length > 0) {
      console.log('🚀 The following gateways appear to be configured and ready for payments:');
      console.table(readyGateways);
    } else {
      console.log('🟡 No gateways are fully configured and active.');
    }

    if (incompleteGateways.length > 0) {
      console.log('\n🔧 The following gateways are incomplete or inactive:');
      console.table(incompleteGateways);
    }

    console.log('---');
    
  } catch (err) {
    console.error('❌ An unexpected error occurred:', err.message);
  }
}

checkDatabase(); 