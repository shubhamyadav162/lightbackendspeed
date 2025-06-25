// @ts-nocheck
// eslint-disable-next-line

import { Queue, QueueScheduler } from 'bullmq';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const redisOpts = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const POSTGRES_URL = process.env.DATABASE_URL!;
if (!POSTGRES_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pgPool = new pg.Pool({ connectionString: POSTGRES_URL });

// Queue names of interest
const QUEUE_NAMES = [
  'transaction-processing',
  'webhook-processing',
  'whatsapp-notifications',
];

// Ensure a QueueScheduler exists for each queue so BullMQ metrics are available
QUEUE_NAMES.forEach((name) => new QueueScheduler(name, { connection: redisOpts }));

async function collectMetrics() {
  for (const name of QUEUE_NAMES) {
    const queue = new Queue(name, { connection: redisOpts });
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');

    await pgPool.query(
      `INSERT INTO queue_metrics (queue_name, waiting, active, completed, failed) VALUES ($1, $2, $3, $4, $5)`,
      [name, counts.waiting, counts.active, counts.completed, counts.failed]
    );

    await queue.close();
  }
  console.log(`[collector] Metrics captured at ${new Date().toISOString()}`);
}

// Run every 10 seconds
setInterval(collectMetrics, 10_000);

// Initial run
collectMetrics().catch((err) => {
  console.error('Initial metrics collection failed', err);
}); 