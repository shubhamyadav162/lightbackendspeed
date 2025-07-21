import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { Queue } from 'bullmq';

/**
 * DELETE /api/v1/admin/queues/clean
 * Body: {
 *   queueName?: string,
 *   olderThan?: number (hours)
 * }
 *
 * Records an audit entry; background worker processes the queue cleanup.
 */
export async function DELETE(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseService();

    const body = await request.json();
    const { queueName = 'all', olderThan = 24 } = body || {};

    const { data: inserted, error: insertErr } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'queue_jobs',
        row_id: null,
        action: 'CLEAN',
        actor_id: 'admin',
        new_data: { queueName, olderThan },
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

    return NextResponse.json({ status: 'scheduled', queueName, olderThan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 