// Simple test worker for Railway deployment
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processPayments() {
  console.log('🚀 Simple test worker started');
  
  try {
    // Check pending transactions
    const { data: pendingTxns, error } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('status', 'created')
      .limit(5);

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    console.log(`Found ${pendingTxns?.length || 0} pending transactions`);

    // Process each transaction
    for (const txn of pendingTxns || []) {
      console.log(`Processing transaction: ${txn.id}`);
      
      // For now, just update status to demonstrate worker is running
      const { error: updateError } = await supabase
        .from('client_transactions')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', txn.id);

      if (updateError) {
        console.error(`Failed to update transaction ${txn.id}:`, updateError);
      } else {
        console.log(`✅ Transaction ${txn.id} marked as processing`);
      }
    }
  } catch (error) {
    console.error('Worker error:', error);
  }
}

// Run every 30 seconds
setInterval(processPayments, 30000);

// Initial run
processPayments();

// Keep process alive
process.on('SIGTERM', () => {
  console.log('Worker shutting down...');
  process.exit(0);
}); 