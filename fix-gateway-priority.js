const { createClient } = require('@supabase/supabase-js');

// Production Supabase configuration
const supabaseUrl = 'https://trmqbpnnboyoneyfleux.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGatewayPriority() {
  console.log('🔧 Fixing Gateway Priority for NextGen Techno');
  console.log('==============================================');

  try {
    // 1. Set NextGen Techno - Production Gateway to highest priority
    console.log('\n1. 🚀 Setting NextGen Techno gateway to highest priority...');
    const { data: updatedGateway, error: updateError } = await supabase
      .from('payment_gateways')
      .update({
        priority: 200,  // Highest priority
        is_active: true
      })
      .eq('id', '2fc79b96-36a3-4a67-ab21-94ce961600b8')  // NextGen Techno - Production Gateway
      .select()
      .single();

    if (updateError) {
      console.log('❌ Priority update error:', updateError.message);
    } else {
      console.log('✅ NextGen Techno gateway priority updated:');
      console.log(`   Name: ${updatedGateway.name}`);
      console.log(`   Priority: ${updatedGateway.priority}`);
      console.log(`   Active: ${updatedGateway.is_active}`);
    }

    // 2. Lower priority of competing NGME gateway
    console.log('\n2. 📉 Lowering priority of competing gateway...');
    const { data: loweredGateway, error: lowerError } = await supabase
      .from('payment_gateways')
      .update({
        priority: 5  // Lower priority
      })
      .eq('id', '67f99d4f-fada-44ad-8c87-9c0cff98d09c')  // NGME's bus gateway
      .select()
      .single();

    if (lowerError) {
      console.log('❌ Priority lower error:', lowerError.message);
    } else {
      console.log('✅ Competing gateway priority lowered:');
      console.log(`   Name: ${loweredGateway.name}`);
      console.log(`   Priority: ${loweredGateway.priority}`);
    }

    // 3. Test the payment API gateway selection
    console.log('\n3. 🧪 Testing payment API gateway selection...');
    const { data: selectedGateway, error: testError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'easebuzz')
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (testError) {
      console.log('❌ Gateway selection test failed:', testError.message);
    } else {
      console.log('✅ Gateway selection test successful!');
      console.log(`   Selected: ${selectedGateway.name}`);
      console.log(`   ID: ${selectedGateway.id}`);
      console.log(`   Priority: ${selectedGateway.priority}`);
      console.log(`   API Key: ${selectedGateway.credentials?.api_key}`);
      console.log(`   Has NextGen credentials: ${selectedGateway.credentials?.api_key === 'FRQT0XKLHY' ? 'YES ✅' : 'NO ❌'}`);
    }

    console.log('\n🎉 GATEWAY PRIORITY FIX COMPLETE!');
    console.log('\n🚀 Now payment API should select correct gateway. Test again...');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fixGatewayPriority().then(() => {
  console.log('\n✅ Priority fix completed!');
  process.exit(0);
}).catch((err) => {
  console.error('💥 Priority fix failed:', err);
  process.exit(1);
}); 