import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'redis-url-parser';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is not set for queue-action-processor');
}
const redisOpts = parse(redisUrl);
const connectionOptions = {
  host: redisOpts.host || 'localhost',
  port: redisOpts.port || 6379,
  password: redisOpts.password,
  db: redisOpts.database || 0,
};

const queueName = 'queue-actions';

// This worker processes actions for the queues, like draining.
// It's a simple example and can be expanded.

const queue = new Queue(queueName, { connection: connectionOptions });

// Function to add a drain job
export async function drainQueue(queueToDrain: string) {
  await queue.add('drain', { queueName: queueToDrain });
}

// Create a new worker
const worker = new Worker(
  queueName,
  async (job) => {
    if (job.name === 'drain') {
      const { queueName: targetQueueName } = job.data;
      console.log(`Draining queue: ${targetQueueName}`);
      try {
        const targetQueue = new Queue(targetQueueName, { connection: connectionOptions });
        await targetQueue.drain();
        console.log(`Queue ${targetQueueName} drained successfully.`);
      } catch (error: any) {
        console.error(`Error draining queue ${targetQueueName}:`, error.message);
        throw error;
      }
    }
  },
  {
    connection: connectionOptions,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} of type ${job.name} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} of type ${job?.name} failed with error: ${err.message}`);
});

console.log(`Worker for queue "${queueName}" started.`); 