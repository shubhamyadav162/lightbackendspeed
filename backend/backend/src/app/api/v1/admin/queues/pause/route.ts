import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { Queue } from 'bullmq';

/**
 * POST /api/v1/admin/queues/pause
 * Body: {
 *   queueName: string,
 *   action: 'pause' | 'resume'
 * }
 *
 * Writes an audit log entry that a background worker will pick up to
 * pause/resume queues via BullMQ. Returns accepted status.
 */
export async function POST(request: NextRequest) {
  const authContext = await getAuthContext(request);
  if (!authContext || authContext.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseService();
    const { queueName, action } = await request.json();

    if (!queueName || !['pause', 'resume'].includes(action)) {
      return NextResponse.json({ error: 'queueName and valid action are required' }, { status: 400 });
    }

    const { data: inserted, error: insertErr } = await supabase.from('audit_logs')
      .insert({
        table_name: 'queue_jobs',
        row_id: null,
        action: action.toUpperCase(),
        actor_id: authContext.userId,
        new_data: { queueName },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) throw new Error(insertErr.message);

    const queue = new Queue('audit-log-queue-actions', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    await queue.add('processAuditLog', { auditLogId: inserted.id });

    await queue.close();

    return NextResponse.json({ status: 'scheduled', queueName, action });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 