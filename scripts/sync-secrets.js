#!/usr/bin/env node

/**
 * Script to clean up Railway secrets after migration to Supabase merchant_config
 * Run with: node scripts/sync-secrets.js
 */

const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Keys to remove from Railway
const DEPRECATED_SECRETS = [
  'MERCHANT_KEY',
  'MERCHANT_SALT',
  'EASEBUZZ_KEY',
  'EASEBUZZ_SALT',
  'GIRTH1PAYMENT_KEY',
  'GIRTH1PAYMENT_SALT'
];

async function main() {
  try {
    console.log('🔄 Starting secrets cleanup...');

    // Verify Supabase connection first
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const { data: configs, error } = await supabase
      .from('merchant_config')
      .select('merchant_id')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    if (!configs?.length) {
      throw new Error('No merchant configs found in Supabase - aborting cleanup');
    }

    // Remove deprecated secrets from Railway
    console.log('🗑️ Removing deprecated secrets from Railway...');
    for (const secret of DEPRECATED_SECRETS) {
      try {
        execSync(`railway variables unset ${secret}`, { stdio: 'inherit' });
        console.log(`✅ Removed ${secret}`);
      } catch (err) {
        console.log(`⚠️ Failed to remove ${secret}: ${err.message}`);
      }
    }

    console.log('✨ Secrets cleanup completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main(); 