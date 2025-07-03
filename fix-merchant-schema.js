const { createClient } = require('@supabase/supabase-js');

// Production Supabase configuration
const supabaseUrl = 'https://trmqbpnnboyoneyfleux.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMerchantRecord() {
  console.log('🔧 Creating Merchant Record with CORRECT Schema');
  console.log('==============================================');

  try {
    // Create merchant record with ACTUAL database schema
    const correctMerchantData = {
      name: 'NextGen Techno Ventures',           // Using 'name' instead of 'merchant_name'
      email: 'merchant@nextgentechno.com',
      phone: '+91-9876543210',
      api_key: 'merchant_test_key_2025',
      api_salt: 'merchant_test_salt_2025',
      webhook_url: 'https://nextgentechno.com/webhook',
      is_active: true
    };

    console.log('📝 Creating merchant with correct schema...');
    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchants')
      .upsert(correctMerchantData, { onConflict: 'api_key' })
      .select()
      .single();

    if (merchantError) {
      console.log('❌ Error:', merchantError.message);
      return;
    }

    console.log('✅ SUCCESS! Merchant record created:');
    console.log('   ID:', newMerchant.id);
    console.log('   Name:', newMerchant.name);
    console.log('   API Key:', newMerchant.api_key);
    console.log('   Active:', newMerchant.is_active);

    // Verify authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authTest, error: authError } = await supabase
      .from('merchants')
      .select('*')
      .eq('api_key', 'merchant_test_key_2025')
      .eq('api_salt', 'merchant_test_salt_2025')
      .single();

    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Authentication working! Merchant found:');
      console.log('   ID:', authTest.id);
      console.log('   Name:', authTest.name);
    }

    console.log('\n🎉 MERCHANT SETUP COMPLETE!');
    console.log('\n🚀 Now test payment again...');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fixMerchantRecord().then(() => {
  console.log('\n✅ Fix completed!');
  process.exit(0);
}).catch((err) => {
  console.error('💥 Fix failed:', err);
  process.exit(1);
}); 