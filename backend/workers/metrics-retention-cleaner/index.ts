// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log(`[metrics-retention] Running cleanup at ${new Date().toISOString()}`);
  const { error } = await supabase.rpc('cleanup_old_metrics');
  if (error) {
    console.error('[metrics-retention] cleanup_old_metrics failed', error);
  } else {
    console.log('[metrics-retention] cleanup_old_metrics completed');
  }
}

// Run every day at 02:30 UTC
cron.schedule('30 2 * * *', cleanup, {
  scheduled: true,
  timezone: 'UTC',
});

console.log('[metrics-retention] worker started – will run daily at 02:30 UTC'); 