const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE'
);

async function createTestMerchant() {
  console.log('🔧 Creating test merchant for payment testing...\n');

  try {
    // Check if test merchant already exists
    const { data: existingMerchant, error: checkError } = await supabase
      .from('merchants')
      .select('*')
      .eq('api_key', 'admin_test_key')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing merchant:', checkError);
      return;
    }

    if (existingMerchant) {
      console.log('✅ Test merchant already exists:', {
        id: existingMerchant.id,
        name: existingMerchant.name,
        api_key: existingMerchant.api_key
      });
      return;
    }

    // Create test merchant
    const { data: merchant, error: createError } = await supabase
      .from('merchants')
      .insert({
        name: 'Admin Test Merchant',
        api_key: 'admin_test_key',
        api_salt: 'admin_test_secret',
        is_active: true,
        environment: 'production',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test merchant:', createError);
      return;
    }

    console.log('✅ Test merchant created successfully:', {
      id: merchant.id,
      name: merchant.name,
      api_key: merchant.api_key,
      is_active: merchant.is_active
    });

    console.log('\n🎯 Test merchant ready for payment testing!');
    console.log('API Key: admin_test_key');
    console.log('API Secret: admin_test_secret');

  } catch (error) {
    console.error('❌ Error during merchant creation:', error);
  }
}

// Run the creation
createTestMerchant().then(() => {
  console.log('\n🔚 Test merchant setup finished.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 