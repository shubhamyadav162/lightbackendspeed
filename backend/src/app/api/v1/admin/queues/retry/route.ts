import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';
import { Queue } from 'bullmq';

const supabase = getSupabaseService();

/**
 * POST /api/v1/admin/queues/retry
 * Body: {
 *   queueName?: string,
 *   jobIds?: string[]
 * }
 *
 * Stub implementation that records retry intent in audit_logs table.
 */
export async function POST(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueName = 'all', jobIds = [] } = body || {};

    // TODO: Integrate with BullMQ over REST/gRPC to actually retry. Placeholder.

    // Record audit entry and retrieve inserted row
    const { data: inserted, error: insertErr } = await supabase.from('audit_logs')
      .insert({
        table_name: 'queue_jobs',
        row_id: null,
        action: 'RETRY',
        actor_id: 'admin', // Fixed: was using undefined authCtx
        new_data: { queueName, jobIds },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // Enqueue job for background processor
    const queue = new Queue('audit-log-queue-actions', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    await queue.add('processAuditLog', { auditLogId: inserted.id });

    await queue.close();

    return NextResponse.json({ status: 'scheduled', queueName, jobIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 