import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';
import { Queue } from 'bullmq';

const supabase = supabaseService;

/**
 * DELETE /api/v1/admin/queues/clean
 * Body: {
 *   queueName?: string,
 *   olderThan?: number (hours)
 * }
 *
 * For now this only records an audit entry – integration with BullMQ
 * maintenance worker will pick up the record and perform cleaning.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueName = 'all', olderThan = 24 } = body || {};

    const { data: inserted, error: insertErr } = await supabase.from('audit_logs')
      .insert({
        table_name: 'queue_jobs',
        row_id: null,
        action: 'CLEAN',
        actor_id: authCtx.userId,
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