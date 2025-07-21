import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

// PATCH /api/v1/alerts/:alertId
// Request body (optional): { resolved: boolean }
// Marks an alert as resolved/unresolved and returns the updated row.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } },
) {
  try {
    const { alertId } = params;
    if (!alertId) throw new Error('Missing alertId parameter');

    // Default `resolved` to true if not provided
    let resolved = true;
    try {
      const body = await request.json();
      if (typeof body?.resolved === 'boolean') {
        resolved = body.resolved;
      }
    } catch (_) {
      // If body isn't JSON, ignore and use default
    }

    const updates = {
      is_resolved: resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    } as Record<string, any>;

    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 