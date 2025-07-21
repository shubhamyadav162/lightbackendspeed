import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// Update specific gateway assignment for client (for toggle functionality)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string, gatewayId: string } }
) {
  try {
    const supabase = getSupabaseService();
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, gatewayId } = params;
    const body = await request.json();
    const { is_active, rotation_order, weight, daily_limit } = body;

    // Update the assignment
    const { data: assignment, error } = await supabase
      .from('client_gateway_assignments')
      .update({
        ...(is_active !== undefined && { is_active }),
        ...(rotation_order !== undefined && { rotation_order }),
        ...(weight !== undefined && { weight }),
        ...(daily_limit !== undefined && { daily_limit }),
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('gateway_id', gatewayId)
      .select(`
        *,
        payment_gateways (
          id, name, provider, is_active, health_status, 
          created_at, updated_at, api_key_last_4
        )
      `)
      .single();

    if (error) {
      console.error('Error updating gateway assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Gateway assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/admin/clients/[clientId]/gateways/[gatewayId]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete gateway assignment for client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string, gatewayId: string } }
) {
  try {
    const supabase = getSupabaseService();
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, gatewayId } = params;

    // Delete the assignment
    const { error } = await supabase
      .from('client_gateway_assignments')
      .delete()
      .eq('client_id', clientId)
      .eq('gateway_id', gatewayId);

    if (error) {
      console.error('Error deleting gateway assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Gateway assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/admin/clients/[clientId]/gateways/[gatewayId]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get specific gateway assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string, gatewayId: string } }
) {
  try {
    const supabase = getSupabaseService();
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, gatewayId } = params;

    // Get specific assignment
    const { data: assignment, error } = await supabase
      .from('client_gateway_assignments')
      .select(`
        *,
        payment_gateways (
          id, name, provider, is_active, health_status, 
          created_at, updated_at, api_key_last_4
        )
      `)
      .eq('client_id', clientId)
      .eq('gateway_id', gatewayId)
      .single();

    if (error) {
      console.error('Error fetching gateway assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Gateway assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error in GET /api/v1/admin/clients/[clientId]/gateways/[gatewayId]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 