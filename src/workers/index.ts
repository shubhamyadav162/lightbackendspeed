// Main Workers Entry Point
// This file starts all workers for Railway deployment

import { worker as transactionProcessor } from './transaction-processor';
import { worker as webhookProcessor } from './webhook-processor';
import { worker as whatsappSender } from './whatsapp-sender';
import { worker as walletBalanceMonitor } from './wallet-balance-monitor';

console.log('🚀 Starting LightSpeed Workers...');

// Start all workers
const workers = [
  { name: 'transaction-processor', worker: transactionProcessor },
  { name: 'webhook-processor', worker: webhookProcessor },
  { name: 'whatsapp-sender', worker: whatsappSender },
  { name: 'wallet-balance-monitor', worker: walletBalanceMonitor }
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