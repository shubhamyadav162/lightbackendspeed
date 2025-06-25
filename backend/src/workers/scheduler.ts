// @ts-nocheck
import { Queue, Worker } from 'bullmq';
import { processTransactionMonitor } from './transaction-monitor';
import { processSettlement } from './settlement-processor';
import { worker as walletBalanceWorker } from './wallet-balance-monitor';

// Redis connection options
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create queues
const transactionMonitorQueue = new Queue('transaction-monitor', { connection });
const settlementQueue = new Queue('settlement', { connection });
const walletBalanceQueue = new Queue('wallet-balance-monitor', { connection });
const auditLogsQueue = new Queue('audit-logs-cleaner', { connection });
const systemStatusQueue = new Queue('system-status-checker', { connection });

// Create workers
const transactionMonitorWorker = new Worker(
  'transaction-monitor',
  async (job) => {
    console.log(`Processing transaction monitor job ${job.id}`);
    await processTransactionMonitor(job);
    console.log(`Completed transaction monitor job ${job.id}`);
  },
  { connection }
);

const settlementWorker = new Worker(
  'settlement',
  async (job) => {
    console.log(`Processing settlement job ${job.id}`);
    await processSettlement(job);
    console.log(`Completed settlement job ${job.id}`);
  },
  { connection }
);

const walletMonitorWorker = new Worker(
  'wallet-balance-monitor',
  async (job) => {
    console.log(`Processing wallet balance monitor job ${job.id}`);
    await walletBalanceWorker.process(job);
    console.log(`Completed wallet balance monitor job ${job.id}`);
  },
  { connection }
);

// Worker implementation – lightweight wrapper calling cleanup RPC
const auditLogsCleanerWorker = new Worker(
  'audit-logs-cleaner',
  async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.rpc('cleanup_old_audit_logs');
    if (error) throw new Error(error.message);
  },
  { connection },
);

// NEW: System Status Checker Worker – pings configured components and upserts status rows
const systemStatusCheckerWorker = new Worker(
  'system-status-checker',
  async () => {
    const { default: runChecker } = await import('./system-status-checker/index');
    await runChecker();
  },
  { connection },
);

// Handle worker events
transactionMonitorWorker.on('completed', (job) => {
  console.log(`Transaction monitor job ${job.id} completed successfully`);
});

transactionMonitorWorker.on('failed', (job, error) => {
  console.error(`Transaction monitor job ${job?.id} failed:`, error);
});

settlementWorker.on('completed', (job) => {
  console.log(`Settlement job ${job.id} completed successfully`);
});

settlementWorker.on('failed', (job, error) => {
  console.error(`Settlement job ${job?.id} failed:`, error);
});

walletMonitorWorker.on('completed', (job) => {
  console.log(`Wallet balance monitor job ${job.id} completed`);
});

walletMonitorWorker.on('failed', (job, error) => {
  console.error(`Wallet balance monitor job ${job?.id} failed:`, error);
});

auditLogsCleanerWorker.on('completed', (job) => {
  console.log(`Audit logs cleanup job ${job.id} completed`);
});

auditLogsCleanerWorker.on('failed', (job, error) => {
  console.error(`Audit logs cleanup job ${job?.id} failed:`, error);
});

systemStatusCheckerWorker.on('completed', (job) => {
  console.log(`System status checker job ${job.id} completed`);
});

systemStatusCheckerWorker.on('failed', (job, error) => {
  console.error(`System status checker job ${job?.id} failed:`, error);
});

// Schedule recurring jobs
async function scheduleJobs() {
  // Check transaction status every 5 minutes
  await transactionMonitorQueue.add(
    'check-pending-transactions',
    {},
    {
      repeat: {
        every: 5 * 60 * 1000 // 5 minutes
      }
    }
  );
  
  // Process settlements daily at midnight
  await settlementQueue.add(
    'daily-settlement',
    {},
    {
      repeat: {
        pattern: '0 0 * * *' // Midnight every day (cron syntax)
      }
    }
  );
  
  // Check wallets daily at 09:00 UTC
  await walletBalanceQueue.add(
    'check-wallet-thresholds',
    {},
    {
      repeat: {
        pattern: '0 9 * * *'
      }
    }
  );
  
  // Clean processed audit logs daily at 04:00 UTC
  await auditLogsQueue.add(
    'cleanup-audit-logs',
    {},
    {
      repeat: {
        pattern: '0 4 * * *'
      }
    }
  );
  
  // Ping system status every 10 minutes
  await systemStatusQueue.add(
    'check-system-status',
    {},
    {
      repeat: {
        every: 10 * 60 * 1000 // 10 minutes
      }
    }
  );
  
  console.log('Scheduled recurring jobs');
}

// Handle graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');
  
  await transactionMonitorWorker.close();
  await settlementWorker.close();
  await walletMonitorWorker.close();
  await auditLogsCleanerWorker.close();
  await systemStatusCheckerWorker.close();
  
  await transactionMonitorQueue.close();
  await settlementQueue.close();
  await walletBalanceQueue.close();
  await auditLogsQueue.close();
  await systemStatusQueue.close();
  
  console.log('Workers shut down successfully');
  process.exit(0);
}

// Handle process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the scheduler
scheduleJobs().catch((error) => {
  console.error('Failed to schedule jobs:', error);
  process.exit(1);
}); 