import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 Webhook processor worker started');

// Function to calculate and process commission
async function processCommission(transaction_id: string) {
  const { data: txn, error: txnError } = await supabase
    .from('client_transactions')
    .select('amount, client_id')
    .eq('id', transaction_id)
    .single();

  if (txnError || !txn) {
    throw new Error(`Transaction ${transaction_id} not found for commission processing.`);
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('fee_percent')
    .eq('id', txn.client_id)
    .single();

  if (clientError || !client) {
    throw new Error(`Client ${txn.client_id} not found for commission processing.`);
  }

  const commission = Math.round(txn.amount * (client.fee_percent / 100));

  const { error: rpcError } = await supabase.rpc('process_commission', {
    p_transaction_id: transaction_id,
    p_commission: commission,
  });

  if (rpcError) {
    throw new Error(`Failed to process commission for txn ${transaction_id}: ${rpcError.message}`);
  }

  console.log(`✅ Commission of ${commission} processed for transaction ${transaction_id}`);
}


const worker = new Worker('webhook-processing', async (job) => {
  const { provider, payload, lightspeed_txn_id } = job.data;
  console.log(`Processing webhook from ${provider} for transaction: ${lightspeed_txn_id}`);

  try {
    let transactionId = lightspeed_txn_id;
    let systemStatus = 'pending';
    let gatewayTxnId = null;

    if (provider === 'easebuzz') {
      transactionId = payload.txnid;
      gatewayTxnId = payload.easepayid || payload.txnid;
      switch (payload.status?.toLowerCase()) {
        case 'success': systemStatus = 'paid'; break;
        case 'failed': case 'failure': systemStatus = 'failed'; break;
        case 'usercancel': systemStatus = 'cancelled'; break;
      }
    } else if (provider === 'razorpay') {
      // Assuming lightspeed_txn_id was passed correctly
      gatewayTxnId = payload.payload?.payment?.entity?.id;
      const event = payload.event;
      if (event === 'payment.captured') {
        systemStatus = 'paid';
      } else if (event === 'payment.failed') {
        systemStatus = 'failed';
      }
    }

    if (!transactionId) {
        throw new Error('Could not determine LightSpeed transaction ID from webhook.');
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('client_transactions')
      .update({
        status: systemStatus,
        gateway_txn_id: gatewayTxnId,
        gateway_response: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (updateError) {
      throw new Error(`Failed to update transaction ${transactionId}: ${updateError.message}`);
    }

    console.log(`✅ Transaction ${transactionId} updated to status: ${systemStatus}`);

    // Calculate commission if payment successful
    if (systemStatus === 'paid') {
      await processCommission(transactionId);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ Failed to process webhook for ${lightspeed_txn_id}:`, errorMessage);
    throw error;
  }
}, {
  connection: { url: REDIS_URL },
  concurrency: parseInt(process.env.MAX_CONCURRENCY_WEBHOOK || '50', 10),
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