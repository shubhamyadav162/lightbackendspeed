import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/queues/jobs/:id
 * Returns BullMQ job details (status, attempts, logs, data, opts).
 * Optional query param: ?queueName=<queue> (defaults to 'transaction-processing').
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing job id' }, { status: 400 });

    // Determine which queue – default fallback, can be overridden via query param
    const queueName = request.nextUrl.searchParams.get('queueName') || 'transaction-processing';

    // Lazy-import bullmq to avoid cold-start penalty when not needed
    const { Queue } = await import('bullmq');

    const queue = new Queue(queueName, {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
      },
    });

    const job = await queue.getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found', id, queue: queueName }, { status: 404 });
    }

    const state = await job.getState();
    const attemptsMade = job.attemptsMade;
    const logs = (await job?.logs())?.logs || [];

    const result = {
      id: job.id,
      name: job.name,
      queue: queueName,
      state,
      attemptsMade,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      returnvalue: job.returnvalue,
      stacktrace: job.stacktrace,
      logs,
    };

    return NextResponse.json({ job: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 