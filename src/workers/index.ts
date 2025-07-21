// Main Workers Entry Point
// This file starts all workers for Railway deployment

import { worker as transactionProcessor } from './transaction-processor';
import { worker as webhookProcessor } from './webhook-processor';
import { worker as queueMetricsRecorder } from './queue-metrics-recorder';
import { worker as workerHealthPing } from './worker-health-ping';
import { worker as workerHealthMonitor } from './worker-health-monitor';
import { worker as lowBalanceNotifier } from './low-balance-notifier';
import { worker as webhookRetry } from './webhook-retry';
import { worker as systemHealthReport } from './system-health-report';
import { worker as slaMonitor } from './sla-monitor';
import { worker as commissionPayoutProcessor } from './commission-payout-processor';
import { worker as archiveTransactions } from './archive-transactions';
import { worker as refreshQueueMetricsView } from './refresh-queue-metrics-view';

console.log('🚀 Starting LightSpeed Workers...');

// Start all workers
const workers = [
  { name: 'transaction-processor', worker: transactionProcessor },
  { name: 'webhook-processor', worker: webhookProcessor },
  { name: 'queue-metrics-recorder', worker: queueMetricsRecorder },
  { name: 'worker-health-ping', worker: workerHealthPing },
  { name: 'worker-health-monitor', worker: workerHealthMonitor },
  { name: 'low-balance-notifier', worker: lowBalanceNotifier },
  { name: 'webhook-retry', worker: webhookRetry },
  { name: 'system-health-report', worker: systemHealthReport },
  { name: 'sla-monitor', worker: slaMonitor },
  { name: 'commission-payout-processor', worker: commissionPayoutProcessor },
  { name: 'archive-transactions', worker: archiveTransactions },
  { name: 'refresh-queue-metrics-view', worker: refreshQueueMetricsView }
];

workers.forEach(({ name, worker }) => {
  if (worker) {
    console.log(`✅ Started worker: ${name}`);
    
    worker.on('failed', (job, err) => {
      console.error(`❌ Worker ${name} job ${job?.id} failed:`, err);
    });
    
    worker.on('error', (err) => {
      console.error(`❌ Worker ${name} error:`, err);
    });
  } else {
    console.warn(`⚠️ Worker ${name} not found or disabled`);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM received, closing workers...');
  
  await Promise.all(
    workers.map(async ({ name, worker }) => {
      if (worker) {
        await worker.close();
        console.log(`✅ Closed worker: ${name}`);
      }
    })
  );
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📛 SIGINT received, closing workers...');
  
  await Promise.all(
    workers.map(async ({ name, worker }) => {
      if (worker) {
        await worker.close();
        console.log(`✅ Closed worker: ${name}`);
      }
    })
  );
  
  process.exit(0);
});

console.log('🎯 All workers started successfully!');
console.log('📊 Worker Status:');
console.log(`   - Total Workers: ${workers.length}`);
console.log(`   - Redis URL: ${process.env.REDIS_URL ? 'Connected' : 'Not Connected'}`);
console.log(`   - Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not Connected'}`);
console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);

// Keep the process alive
setInterval(() => {
  // Health check ping
}, 30000); 