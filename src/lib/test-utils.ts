import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function generateMockPaymentRequest() {
  return {
    amount: 1000, // 10 rupees in paisa
    order_id: `TEST_${Date.now()}`,
    client_key: process.env.TEST_CLIENT_KEY || 'test_client_key',
    signature: 'test_signature', // Will be computed in the test
    redirect_url: 'http://localhost:3000/callback'
  };
}

export async function setupTestDatabase() {
  // Create test merchant
  await supabase
    .from('merchants')
    .upsert({
      id: 'test_merchant',
      name: 'Test Merchant',
      email: 'test@example.com'
    });

  // Create test gateway
  await supabase
    .from('payment_gateways')
    .upsert({
      id: 'test_gateway',
      name: 'Test Gateway',
      type: 'test',
      is_active: true,
      credentials: {
        key: 'test_key',
        secret: 'test_secret'
      }
    });

  // Create test client
  await supabase
    .from('clients')
    .upsert({
      id: 'test_client',
      merchant_id: 'test_merchant',
      client_key: process.env.TEST_CLIENT_KEY || 'test_client_key',
      client_salt: process.env.TEST_CLIENT_SALT || 'test_client_salt'
    });

  // Create test wallet
  await supabase
    .from('commission_wallets')
    .upsert({
      client_id: 'test_client',
      balance_due: 0
    });
}

export async function cleanupTestDatabase() {
  // Delete test data in reverse order of dependencies
  await supabase
    .from('commission_wallets')
    .delete()
    .eq('client_id', 'test_client');

  await supabase
    .from('clients')
    .delete()
    .eq('id', 'test_client');

  await supabase
    .from('payment_gateways')
    .delete()
    .eq('id', 'test_gateway');

  await supabase
    .from('merchants')
    .delete()
    .eq('id', 'test_merchant');

  // Clean up any test transactions
  await supabase
    .from('client_transactions')
    .delete()
    .like('order_id', 'TEST_%');
} 