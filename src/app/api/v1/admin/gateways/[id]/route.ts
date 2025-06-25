import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';

const supabase = supabaseService;

/**
 * Helper to extract id param from request URL.
 */
function getGatewayId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  const id = segments[segments.length - 1];
  return id || null;
}

// Update gateway (priority, status, credentials, etc.)
export async function PUT(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getGatewayId(request);
    if (!id) return NextResponse.json({ error: 'Invalid gateway id' }, { status: 400 });

    const body = await request.json();
    const allowed = [
      'priority',
      'is_active',
      'monthly_limit',
      'credentials',
      'success_rate',
      'name',
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('payment_gateways')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ gateway: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// Delete gateway (soft delete -> is_active=false)
export async function DELETE(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getGatewayId(request);
    if (!id) return NextResponse.json({ error: 'Invalid gateway id' }, { status: 400 });

    const { data, error } = await supabase
      .from('payment_gateways')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Archive transactions could be implemented via worker/trigger, stubbed here

    return NextResponse.json({ gateway: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 