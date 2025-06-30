import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function processAuditLog(id: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return;

  const { action, new_data } = data;
  const { queueName, jobIds, olderThan } = new_data as any;

  const queue = new Queue(queueName, { connection: { host: process.env.REDIS_HOST } });

  switch (action) {
    case 'RETRY':
      if (Array.isArray(jobIds)) {
        await Promise.all(jobIds.map((jid) => queue.getJob(jid).then((j) => j?.retry())));
      } else {
        await queue.retryJobs();
      }
      break;
    case 'CLEAN':
      await queue.clean(olderThan * 3600 * 1000, 1000, 'completed');
      await queue.clean(olderThan * 3600 * 1000, 1000, 'failed');
      break;
    case 'PAUSE':
      await queue.pause();
      break;
    case 'RESUME':
      await queue.resume();
      break;
  }

  await supabase.from('audit_logs').update({ processed: true }).eq('id', id);
}

const worker = new Worker('audit-log-queue-actions', async (job) => {
  await processAuditLog(job.data.auditLogId);
});

worker.on('completed', (job) => console.log(`processed audit log ${job.id}`));
worker.on('failed', (job, err) => console.error(`failed ${job?.id}`, err)); 