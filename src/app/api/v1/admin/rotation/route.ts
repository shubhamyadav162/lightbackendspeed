import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/v1/admin/rotation
 * Get rotation configuration for all clients or specific client
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client at runtime
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (clientId) {
      // Get specific client's rotation config
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          client_gateway_assignments (
            id,
            rotation_order,
            is_active,
            weight,
            daily_limit,
            daily_usage,
            last_used_at,
            payment_gateways (
              id,
              name,
              provider,
              is_active
            )
          )
        `)
        .eq('id', clientId)
        .single();

      if (clientError) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      return NextResponse.json({
        client,
        rotation_status: {
          mode: client.rotation_mode,
          current_position: client.current_rotation_position,
          total_gateways: client.total_assigned_gateways,
          last_rotation: client.last_rotation_at,
          daily_reset: client.rotation_reset_daily
        }
      });
    } else {
      // Get all clients with rotation summary
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          rotation_mode,
          current_rotation_position,
          total_assigned_gateways,
          last_rotation_at,
          status
        `)
        .order('company_name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ clients });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/rotation/assign
 * Assign gateways to a client in rotation order
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client at runtime
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { client_id, gateway_ids, rotation_mode = 'round_robin' } = body;

    if (!client_id || !gateway_ids || !Array.isArray(gateway_ids)) {
      return NextResponse.json({ 
        error: 'client_id and gateway_ids array required' 
      }, { status: 400 });
    }

    // Update client rotation mode
    const { error: clientError } = await supabase
      .from('clients')
      .update({ rotation_mode })
      .eq('id', client_id);

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 });
    }

    // Use stored procedure to assign gateways
    const { error: assignError } = await supabase
      .rpc('assign_gateways_to_client', {
        p_client_id: client_id,
        p_gateway_ids: gateway_ids
      });

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Assigned ${gateway_ids.length} gateways to client in rotation order`,
      rotation_mode
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 