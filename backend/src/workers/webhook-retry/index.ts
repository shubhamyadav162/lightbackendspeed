import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

// Webhook Retry Worker (2025-07-01)
// Periodically scans webhook_events for rows with status = 'failed' && next_retry_at <= NOW()
// and re-enqueues processing job back to the webhook-processing queue. Ensures failed merchant
// webhooks are retried with exponential back-off controlled by webhook-processor updates.

const RETRY_INTERVAL_MS = Number(process.env.WEBHOOK_RETRY_INTERVAL_MS ?? '60000');
const connection = { url: process.env.REDIS_URL! };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const webhookQueue = new Queue('webhook-processing', { connection });

async function scanAndRetry() {
  const now = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from('webhook_events')
    .select('id, transaction_id, attempts')
    .eq('status', 'failed')
    .lte('next_retry_at', now)
    .limit(100);

  if (error) {
    console.error('[webhook-retry] DB error', error);
    return;
  }

  for (const row of rows ?? []) {
    console.log(`[webhook-retry] Re-queuing txn ${row.transaction_id} (attempt ${row.attempts + 1})`);
    await webhookQueue.add('retry', { transaction_id: row.transaction_id, webhook_data: null });

    // Mark as pending so we don't double enqueue
    await supabase
      .from('webhook_events')
      .update({ status: 'pending' })
      .eq('id', row.id);
  }
}

setInterval(scanAndRetry, RETRY_INTERVAL_MS);
console.log('[webhook-retry] Started worker with interval', RETRY_INTERVAL_MS, 'ms'); 