/**
 * Auto-Add PayU Gateway Script
 * यह script PayU credentials को automatically add करती है
 * 
 * Usage: node frontend/src/scripts/auto-add-payu-gateway.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://hxstkssymcyaojyhlcsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4c3Rrc3N5bWN5YW9qeWhsY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzQzNTcsImV4cCI6MjA1MDI1MDM1N30.dZVU2Zh2bVQJOUCTyxJrKlKfZDzOcA_P0mB-KheMWLY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PayU Credentials - Official Production
const PAYU_CREDENTIALS = {
  gateway_type: 'payu',
  name: 'PayU Money Production',
  is_active: true,
  priority: 2,
  commission_type: 'percentage',
  commission_value: 2.5,
  credentials: {
    api_key: 'xKLUxQ',
    api_secret: 'OhIeWQdMjtR4K7w1alV6c2emB6RnKXWA',
    client_id: 'caf72985a7761ab9938a202da34bfd79fc91eae257a9c400de08670f690aa41b',
    client_secret: '5055b162f2ebe71fb814e5cf36ebbf4d32f0b5c7e6bfd3f70da415bbe1a993ff',
    environment: 'production'
  },
  webhook_url: 'https://api.lightspeedpay.in/api/v1/callback/payu',
  success_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/success',
  failed_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/failed',
  description: 'PayU Money gateway for production transactions with Next Gen Techno Ventures account'
};

async function autoAddPayUGateway() {
  console.log('🚀 Starting PayU Gateway Auto-Addition Process...');
  
  try {
    // Check if PayU gateway already exists
    const { data: existingGateways, error: checkError } = await supabase
      .from('payment_gateways')
      .select('id, name, gateway_type')
      .eq('gateway_type', 'payu')
      .eq('name', 'PayU Money Production');

    if (checkError) {
      console.error('❌ Error checking existing gateways:', checkError);
      return;
    }

    if (existingGateways && existingGateways.length > 0) {
      console.log('⚠️ PayU Money Production gateway already exists!');
      console.log('📋 Existing gateway:', existingGateways[0]);
      
      // Update existing gateway with latest credentials
      const { data: updateData, error: updateError } = await supabase
        .from('payment_gateways')
        .update({
          ...PAYU_CREDENTIALS,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGateways[0].id)
        .select();

      if (updateError) {
        console.error('❌ Error updating gateway:', updateError);
        return;
      }

      console.log('✅ PayU gateway updated successfully!');
      console.log('📊 Updated gateway data:', updateData[0]);
      return;
    }

    // Add new PayU gateway
    const { data: newGateway, error: insertError } = await supabase
      .from('payment_gateways')
      .insert([{
        ...PAYU_CREDENTIALS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.error('❌ Error adding PayU gateway:', insertError);
      return;
    }

    console.log('🎉 PayU Gateway Added Successfully!');
    console.log('📊 Gateway Details:');
    console.log('- Gateway ID:', newGateway[0].id);
    console.log('- Name:', newGateway[0].name);
    console.log('- Type:', newGateway[0].gateway_type);
    console.log('- Status:', newGateway[0].is_active ? 'Active' : 'Inactive');
    console.log('- Priority:', newGateway[0].priority);
    console.log('- Commission:', `${newGateway[0].commission_value}%`);
    console.log('- Webhook URL:', newGateway[0].webhook_url);
    console.log('- Success URL:', newGateway[0].success_url);
    console.log('- Failed URL:', newGateway[0].failed_url);

    console.log('\n✅ PayU Gateway को आपके LightSpeedPay system में successfully add कर दिया गया है!');
    console.log('\n📋 Next Steps:');
    console.log('1. PayU Dashboard में जाकर webhook URLs add करें');
    console.log('2. Test transaction करके verify करें');
    console.log('3. Production में live कर दें');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the script
autoAddPayUGateway(); 