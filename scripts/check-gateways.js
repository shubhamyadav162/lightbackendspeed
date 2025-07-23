const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE'
);

async function checkGateways() {
  console.log('🔍 Checking payment gateways in database...\n');

  try {
    // Get all gateways
    const { data: allGateways, error: allError } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all gateways:', allError);
      return;
    }

    console.log(`📊 Total gateways found: ${allGateways.length}\n`);

    // Display all gateways
    allGateways.forEach((gateway, index) => {
      console.log(`${index + 1}. ${gateway.name || 'Unnamed Gateway'}`);
      console.log(`   ID: ${gateway.id}`);
      console.log(`   Provider: ${gateway.provider || 'unknown'}`);
      console.log(`   Active: ${gateway.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Priority: ${gateway.priority || 'N/A'}`);
      console.log(`   Environment: ${gateway.environment || 'N/A'}`);
      console.log(`   Has Credentials: ${gateway.credentials ? '✅ Yes' : '❌ No'}`);
      
      if (gateway.credentials) {
        console.log(`   API Key: ${gateway.credentials.api_key ? '✅ Present' : '❌ Missing'}`);
        console.log(`   API Secret: ${gateway.credentials.api_secret ? '✅ Present' : '❌ Missing'}`);
      }
      
      console.log(`   Created: ${gateway.created_at}`);
      console.log(`   Updated: ${gateway.updated_at}`);
      console.log('');
    });

    // Get active gateways only
    const { data: activeGateways, error: activeError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (activeError) {
      console.error('❌ Error fetching active gateways:', activeError);
      return;
    }

    console.log(`🚀 Active gateways: ${activeGateways.length}\n`);

    if (activeGateways.length === 0) {
      console.log('❌ No active gateways found! This is why payment links are not working.');
      console.log('💡 Solution: Activate at least one gateway in the database.');
      return;
    }

    // Check if any active gateway has credentials
    const gatewaysWithCredentials = activeGateways.filter(g => g.credentials);
    
    console.log(`🔐 Active gateways with credentials: ${gatewaysWithCredentials.length}\n`);

    if (gatewaysWithCredentials.length === 0) {
      console.log('❌ No active gateways have credentials! This is why payment links are not working.');
      console.log('💡 Solution: Add credentials to at least one active gateway.');
      return;
    }

    // Show the top priority gateway
    const topGateway = activeGateways[0];
    console.log('🥇 Top Priority Gateway:');
    console.log(`   Name: ${topGateway.name || 'Unnamed'}`);
    console.log(`   Provider: ${topGateway.provider || 'unknown'}`);
    console.log(`   Priority: ${topGateway.priority || 'N/A'}`);
    console.log(`   Has Credentials: ${topGateway.credentials ? '✅ Yes' : '❌ No'}`);
    
    if (topGateway.credentials) {
      console.log(`   API Key: ${topGateway.credentials.api_key ? '✅ Present' : '❌ Missing'}`);
      console.log(`   API Secret: ${topGateway.credentials.api_secret ? '✅ Present' : '❌ Missing'}`);
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error during gateway check:', error);
  }
}

// Run the check
checkGateways().then(() => {
  console.log('\n🔚 Gateway check finished.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 