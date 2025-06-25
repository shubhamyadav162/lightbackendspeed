import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = supabaseService;

/**
 * PUT /api/v1/admin/gateways/priority
 * Body: { updates: Array<{ id: string; priority: number }> }
 *
 * Allows drag-and-drop UI to send bulk priority updates in a single request.
 * Returns updated list of gateways (ordered by priority ASC).
 */
export async function PUT(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = (body?.updates ?? []) as { id: string; priority: number }[];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 });
    }

    // Validate items have id & numeric priority
    for (const { id, priority } of updates) {
      if (!id || typeof priority !== 'number') {
        return NextResponse.json({ error: 'Each update must include id & priority' }, { status: 400 });
      }
    }

    // Build upsert payload
    const upserts = updates.map(({ id, priority }) => ({ id, priority, updated_at: new Date().toISOString() }));

    // Perform upsert – use ON CONFLICT (id) DO UPDATE SET priority = EXCLUDED.priority
    const { error } = await supabaseService
      .from('payment_gateways')
      .upsert(upserts, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      throw new Error(error.message);
    }

    // Return ordered list of gateways after update
    const { data: gateways, error: selErr } = await supabaseService
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: true });

    if (selErr) throw new Error(selErr.message);

    return NextResponse.json({ gateways });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 