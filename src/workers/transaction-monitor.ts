import { Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase service role creds must be present in env
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/**
 * Check the status of pending transactions and update them.
 *
 * The job payload can include optional filters:
 *   { olderThanMinutes?: number, limit?: number }
 */
export async function processTransactionMonitor(job: Job) {
  const olderThanMinutes: number = job.data?.olderThanMinutes ?? 10;
  const limit: number = job.data?.limit ?? 200;

  const cutoffIso = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

  // Fetch transactions that are still PENDING and older than cutoff
  const { data: pendingTxns, error } = await supabase
    .from('transactions')
    .select('id, pg_id, txn_id, status, created_at')
    .eq('status', 'PENDING')
    .lt('created_at', cutoffIso)
    .limit(limit);

  if (error) {
    console.error('[transaction-monitor] error fetching pending transactions:', error);
    return;
  }

  if (!pendingTxns || pendingTxns.length === 0) {
    console.log('[transaction-monitor] no pending transactions to check');
    return;
  }

  for (const txn of pendingTxns) {
    try {
      // TODO: Replace with real PSP status fetch – here we fake it: 80% chance of success, else still pending.
      const random = Math.random();
      if (random < 0.8) {
        const newStatus = 'COMPLETED';
        await supabase
          .from('transactions')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', txn.id);
        console.log(`[transaction-monitor] txn ${txn.id} marked ${newStatus}`);
      }
    } catch (err) {
      console.error(`[transaction-monitor] failed to update txn ${txn.id}:`, err);
    }
  }
} 