import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = getSupabaseService();

/**
 * PUT /api/v1/admin/gateways/priority
 * Body: { updates: Array<{ id: string; priority: number }> }
 *
 * Allows drag-and-drop UI to send bulk priority updates in a single request.
 * Returns updated list of gateways (ordered by priority ASC).
 */
export async function PUT(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
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
    const { error } = await supabase
      .from('payment_gateways')
      .upsert(upserts, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      throw new Error(error.message);
    }

    // Return ordered list of gateways after update
    const { data: gateways, error: selErr } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: true });

    if (selErr) throw new Error(selErr.message);

    return NextResponse.json({ gateways });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 