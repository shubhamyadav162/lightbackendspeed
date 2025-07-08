// @ts-nocheck
// eslint-disable-next-line

import { Queue, QueueScheduler } from 'bullmq';
import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'redis-url-parser';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not set');
}

const redisOpts = parse(redisUrl);

const connectionOptions = {
  host: redisOpts.host || 'localhost',
  port: redisOpts.port || 6379,
  password: redisOpts.password,
  db: redisOpts.database || 0,
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
QUEUE_NAMES.forEach((name) => new QueueScheduler(name, { connection: connectionOptions }));

async function collectMetrics() {
  for (const name of QUEUE_NAMES) {
    const queue = new Queue(name, { connection: connectionOptions });
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