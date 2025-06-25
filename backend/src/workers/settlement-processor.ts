import { Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Process settlements for completed transactions
 * This worker batches transactions for settlement to merchant bank accounts
 */
export async function processSettlement(job: Job) {
  console.log('Running settlement processor job:', job.id);
  
  try {
    // Get transactions ready for settlement
    const transactions = await getTransactionsReadyForSettlement();
    
    if (!transactions || transactions.length === 0) {
      console.log('No transactions ready for settlement');
      return;
    }
    
    console.log(`Found ${transactions.length} transactions ready for settlement`);
    
    // Group transactions by merchant
    const merchantTransactions = groupTransactionsByMerchant(transactions);
    
    // Process settlements for each merchant
    for (const [merchantId, txns] of Object.entries(merchantTransactions)) {
      await processMerchantSettlement(merchantId, txns);
    }
    
    console.log('Settlement processing completed successfully');
  } catch (error) {
    console.error('Error in settlement processor:', error);
    throw error;
  }
}

/**
 * Get transactions that are ready for settlement
 */
async function getTransactionsReadyForSettlement() {
  // In a real implementation, this would have more complex logic
  // for determining which transactions are ready for settlement
  // For example, based on merchant settlement cycle, minimum amount, etc.
  
  // For simplicity, we'll get completed transactions that are at least 1 day old
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'COMPLETED')
    .lt('created_at', oneDayAgo);
  
  if (error) {
    throw new Error(`Failed to fetch transactions for settlement: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Group transactions by merchant for batch processing
 */
function groupTransactionsByMerchant(transactions: any[]) {
  const merchantTransactions: Record<string, any[]> = {};
  
  for (const txn of transactions) {
    if (!merchantTransactions[txn.merchant_id]) {
      merchantTransactions[txn.merchant_id] = [];
    }
    
    merchantTransactions[txn.merchant_id].push(txn);
  }
  
  return merchantTransactions;
}

/**
 * Process settlement for a merchant
 */
async function processMerchantSettlement(merchantId: string, transactions: any[]) {
  try {
    console.log(`Processing settlement for merchant ${merchantId} with ${transactions.length} transactions`);
    
    // Get merchant bank details
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single();
    
    if (merchantError || !merchant) {
      console.error(`Could not find merchant details for ${merchantId}`);
      return;
    }
    
    // Calculate total settlement amount
    const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    // In a real implementation, this would call a banking API to initiate a bank transfer
    // For now, we'll just simulate the settlement
    const settlementId = `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Log the settlement details
    console.log(`Settlement ${settlementId} for merchant ${merchantId}:`);
    console.log(`- Total amount: ${totalAmount}`);
    console.log(`- Transaction count: ${transactions.length}`);
    
    // Update transaction records to mark as settled
    for (const txn of transactions) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          settlement_id: settlementId,
          settlement_date: new Date().toISOString()
        })
        .eq('id', txn.id);
      
      if (updateError) {
        console.error(`Failed to update transaction ${txn.id} for settlement:`, updateError);
      }
    }
    
    // Record the settlement
    await recordSettlement(merchantId, settlementId, totalAmount, transactions.length);
    
    console.log(`Settlement ${settlementId} processed successfully`);
  } catch (error) {
    console.error(`Error processing settlement for merchant ${merchantId}:`, error);
  }
}

/**
 * Record settlement details
 */
async function recordSettlement(
  merchantId: string,
  settlementId: string,
  amount: number,
  transactionCount: number
) {
  try {
    // In a real implementation, this would create a record in a settlements table
    console.log(`Recording settlement ${settlementId} for merchant ${merchantId}`);
    console.log(`- Amount: ${amount}`);
    console.log(`- Transaction count: ${transactionCount}`);
    
    // This is where you would update the merchant's settlement records
    // For now, we'll just log it
  } catch (error) {
    console.error(`Error recording settlement ${settlementId}:`, error);
  }
} 