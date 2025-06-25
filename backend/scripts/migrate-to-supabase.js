// utils/migrate-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
require('dotenv').config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MongoDB setup
const mongoUri = process.env.MONGODB_URI;

// Define MongoDB schemas for existing data
const merchantSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  apiKey: String,
  apiSalt: String,
  webhookUrl: String,
  walletBalance: Number,
  isSandbox: Boolean,
  isActive: Boolean
});

const transactionSchema = new mongoose.Schema({
  txnId: String,
  merchant_id: mongoose.Schema.Types.ObjectId,
  amount: Number,
  currency: String,
  customer_email: String,
  customer_phone: String,
  status: String,
  pgResponse: Object,
  vpaId: String,
  isSandbox: Boolean,
  createdAt: Date
});

const affiliateSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  commission: Number,
  totalCommissionEarned: Number,
  totalCommissionDisbursed: Number,
  dueCommission: Number,
  isActive: Boolean
});

const affiliateMerchantSchema = new mongoose.Schema({
  affliateUserId: mongoose.Schema.Types.ObjectId,
  merchantId: mongoose.Schema.Types.ObjectId
});

// Register models
const Merchant = mongoose.model('Merchant', merchantSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const AffiliateUser = mongoose.model('AffiliateUser', affiliateSchema);
const AffiliateMerchant = mongoose.model('AffiliateMerchant', affiliateMerchantSchema);

// Migration functions
async function migrateMerchants() {
  console.log('Migrating merchants...');
  const merchants = await Merchant.find({});
  let count = 0;
  
  for (const merchant of merchants) {
    const { data, error } = await supabase.from('merchants').insert({
      merchant_name: merchant.name,
      email: merchant.email,
      phone: merchant.phone,
      api_key: merchant.apiKey,
      api_salt: merchant.apiSalt,
      webhook_url: merchant.webhookUrl,
      wallet_balance: merchant.walletBalance || 0,
      is_sandbox: merchant.isSandbox || true,
      is_active: merchant.isActive || true
    });
    
    if (error) {
      console.error(`Error migrating merchant ${merchant.email}:`, error);
    } else {
      count++;
    }
  }
  
  console.log(`Migrated ${count} of ${merchants.length} merchants`);
}

async function migrateTransactions() {
  console.log('Migrating transactions...');
  const batchSize = 1000;
  let skip = 0;
  let count = 0;
  let total = await Transaction.countDocuments();
  
  while (skip < total) {
    const transactions = await Transaction.find({}).skip(skip).limit(batchSize);
    
    for (const txn of transactions) {
      // Find the new merchant ID in Supabase
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('api_key', txn.merchant_id.toString())
        .single();
      
      if (!merchant) {
        console.warn(`Could not find merchant for transaction ${txn.txnId}`);
        continue;
      }
      
      const { data, error } = await supabase.from('transactions').insert({
        txn_id: txn.txnId,
        merchant_id: merchant.id,
        amount: txn.amount,
        currency: txn.currency || 'INR',
        customer_email: txn.customer_email,
        customer_phone: txn.customer_phone || '',
        status: txn.status,
        pg_response: txn.pgResponse || {},
        vpa_id: txn.vpaId,
        is_sandbox: txn.isSandbox || false,
        created_at: txn.createdAt || new Date()
      });
      
      if (error) {
        console.error(`Error migrating transaction ${txn.txnId}:`, error);
      } else {
        count++;
      }
    }
    
    skip += batchSize;
    console.log(`Processed ${Math.min(skip, total)} of ${total} transactions`);
  }
  
  console.log(`Migrated ${count} of ${total} transactions`);
}

async function migrateAffiliates() {
  console.log('Migrating affiliates...');
  const affiliates = await AffiliateUser.find({});
  let count = 0;
  
  for (const affiliate of affiliates) {
    const { data, error } = await supabase.from('affiliates').insert({
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.mobile,
      commission_percentage: affiliate.commission,
      total_commission_earned: affiliate.totalCommissionEarned || 0,
      total_commission_disbursed: affiliate.totalCommissionDisbursed || 0,
      due_commission: affiliate.dueCommission || 0,
      is_active: affiliate.isActive || true
    });
    
    if (error) {
      console.error(`Error migrating affiliate ${affiliate.email}:`, error);
    } else {
      count++;
    }
  }
  
  console.log(`Migrated ${count} of ${affiliates.length} affiliates`);
}

async function migrateAffiliateMerchants() {
  console.log('Migrating affiliate-merchant relationships...');
  const relationships = await AffiliateMerchant.find({});
  let count = 0;
  
  for (const rel of relationships) {
    // Find the new affiliate ID in Supabase
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('email', rel.affliateUserId.toString())
      .single();
    
    // Find the new merchant ID in Supabase
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('api_key', rel.merchantId.toString())
      .single();
    
    if (!affiliate || !merchant) {
      console.warn(`Could not find affiliate or merchant for relationship`);
      continue;
    }
    
    const { data, error } = await supabase.from('affiliate_merchants').insert({
      affiliate_id: affiliate.id,
      merchant_id: merchant.id
    });
    
    if (error) {
      console.error(`Error migrating affiliate-merchant relationship:`, error);
    } else {
      count++;
    }
  }
  
  console.log(`Migrated ${count} of ${relationships.length} affiliate-merchant relationships`);
}

// Main migration function
async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Run migrations in sequence
    await migrateMerchants();
    await migrateTransactions();
    await migrateAffiliates();
    await migrateAffiliateMerchants();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateData(); 