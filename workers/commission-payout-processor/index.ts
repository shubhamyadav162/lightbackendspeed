import { Worker, Job } from 'bullmq';
import { getServiceRoleClient } from '../../lib/supabase/service-role';

// Initialize Supabase client with service role
const supabase = getServiceRoleClient();

const connectionDetails = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface PayoutJobData {
  // This interface can be expanded later if we want to trigger payouts
  // for specific clients, rather than all eligible ones.
}

/**
 * This worker processes commission payouts. It can be triggered by a cron job.
 * It finds all wallets with a balance due above a certain threshold and
 * simulates paying out the commission.
 */
const commissionPayoutWorker = new Worker<PayoutJobData>(
  'commission-payout-processing',
  async (job: Job) => {
    console.log('Starting commission payout processing job...', job.data);

    const PAYOUT_THRESHOLD_PAISA = 1000 * 100; // 1000 INR

    const { data: wallets, error: fetchError } = await supabase
      .from('wallets')
      .select('id, client_id, balance_due, clients ( id, company_name )')
      .gt('balance_due', PAYOUT_THRESHOLD_PAISA);

    if (fetchError) {
      console.error('Error fetching wallets for commission payout:', fetchError);
      throw fetchError;
    }

    if (!wallets || wallets.length === 0) {
      console.log('No wallets with balance due over the threshold. Exiting job.');
      return { status: 'No eligible wallets found' };
    }

    console.log(`Found ${wallets.length} wallets to process for payouts.`);

    for (const wallet of wallets) {
      const balanceToPay = wallet.balance_due;
      // @ts-ignore - Handled by select, but TS can't infer the nested type
      const clientName = wallet.clients.company_name;

      try {
        // --- PSEUDO-CODE for Payout Provider Integration ---
        // In a real scenario, this is where the integration with a payment
        // provider's Payouts API would happen.
        console.log(`Simulating payout of ${balanceToPay / 100} INR for client: ${clientName}`);
        // const payoutResult = await paymentProvider.payouts.create(...);
        // --- END PSEUDO-CODE ---

        // If the payout above is successful, record it in our database.
        // This involves creating a negative wallet entry and decrementing the balance.
        const { error: rpcError } = await supabase.rpc('process_commission_payout', {
          p_wallet_id: wallet.id,
          p_payout_amount: balanceToPay,
        });

        if (rpcError) {
          console.error(`Failed to record payout in DB for wallet ${wallet.id}:`, rpcError);
          // TODO: Add alerting or retry logic for DB failures after a successful payout.
          continue;
        }

        console.log(`Successfully processed and recorded payout for wallet ${wallet.id}.`);

      } catch (payoutProviderError) {
        console.error(`Error processing payout via payment provider for wallet ${wallet.id}:`, payoutProviderError);
        // TODO: Add alerting for payout provider failures.
      }
    }

    return { status: 'Completed', processedCount: wallets.length };
  },
  { connection: connectionDetails }
);

commissionPayoutWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

commissionPayoutWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});

console.log('Commission Payout Worker initialized and listening for jobs.');

/*
  Reminder: The following SQL function `process_commission_payout` should exist in the database.
  It was added in the `20250801_align_schema_with_blueprint.sql` migration.

  CREATE OR REPLACE FUNCTION process_commission_payout(
    p_wallet_id UUID,
    p_payout_amount INTEGER
  ) RETURNS VOID AS $$
  BEGIN
    -- Insert a negative entry for the payout to create an audit trail
    INSERT INTO wallet_entries (wallet_id, transaction_id, amount, type)
    VALUES (p_wallet_id, NULL, -p_payout_amount, 'COMMISSION_PAYOUT');
    
    -- Decrement the balance due in the main wallets table
    UPDATE wallets 
    SET balance_due = balance_due - p_payout_amount
    WHERE id = p_wallet_id;
  END;
  $$ LANGUAGE plpgsql;
*/ 