import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 Transaction processor worker started');

const worker = new Worker('transaction-processing', async (job) => {
  const { transaction_id, gateway_id, amount, order_id } = job.data;
  
  console.log(`Processing transaction: ${transaction_id}`);

  try {
    // 1. Get gateway credentials from database
    const { data: gateway, error: gwError } = await supabase
      .from('payment_gateways')
      .select('provider, credentials')
      .eq('id', gateway_id)
      .single();

    if (gwError || !gateway) {
      throw new Error(`Gateway not found for id: ${gateway_id}`);
    }

    // This is a placeholder. In a real scenario, you would use an adapter
    // for each payment provider (e.g., Razorpay, Easebuzz) to create the order.
    console.log(`Calling ${gateway.provider} with amount ${amount}`);
    const checkout_url = `https://dummy-checkout.com/${gateway.provider}/${order_id}`;
    
    // 2. Update transaction record with the checkout URL and gateway_txn_id (placeholder)
    const { error: updateError } = await supabase
      .from('client_transactions')
      .update({ 
        status: 'initiated',
        gateway_txn_id: order_id, // Placeholder, this would come from the gateway API response
        gateway_response: { checkout_url }
      })
      .eq('id', transaction_id);

    if (updateError) {
      throw new Error(`Failed to update transaction ${transaction_id}: ${updateError.message}`);
    }

    console.log(`✅ Transaction ${transaction_id} processed successfully. Checkout URL: ${checkout_url}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ Failed to process transaction ${transaction_id}:`, errorMessage);
    // Optionally, update the transaction status to 'failed' in the database
    await supabase
      .from('client_transactions')
      .update({ status: 'failed', last_error: errorMessage })
      .eq('id', transaction_id);
    throw error; // Re-throw to let BullMQ handle retry logic
  }
}, {
  connection: { url: REDIS_URL },
  concurrency: parseInt(process.env.MAX_CONCURRENCY_TRANSACTION || '25', 10),
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
});

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
  } else {
    console.error(`A job failed with error: ${err.message}`);
  }
}); 