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
  
  console.log('Scheduled recurring jobs');
}

// Handle graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');
  
  await transactionMonitorWorker.close();
  await settlementWorker.close();
  await walletMonitorWorker.close();
  
  await transactionMonitorQueue.close();
  await settlementQueue.close();
  await walletBalanceQueue.close();
  
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