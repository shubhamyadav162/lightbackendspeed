import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/v1/admin/rotation/controls
 * Control rotation operations: reset, change mode, manual advance, toggle gateway assignment
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
    const { action, client_id, params } = body;

    if (!action || !client_id) {
      return NextResponse.json({ 
        error: 'action and client_id required' 
      }, { status: 400 });
    }

    switch (action) {
      case 'reset_position':
        return await resetRotationPosition(supabase, client_id);
      
      case 'change_mode':
        return await changeRotationMode(supabase, client_id, params?.mode);
      
      case 'manual_advance':
        return await manualAdvancePosition(supabase, client_id, params?.steps || 1);
      
      case 'toggle_daily_reset':
        return await toggleDailyReset(supabase, client_id, params?.enabled);
      
      case 'toggle_gateway_assignment':
        return await toggleGatewayAssignment(supabase, client_id, params?.gateway_id, params?.is_active);
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported: reset_position, change_mode, manual_advance, toggle_daily_reset, toggle_gateway_assignment' 
        }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function resetRotationPosition(supabase: any, clientId: string) {
  const { error } = await supabase
    .rpc('reset_client_rotation_position', {
      p_client_id: clientId
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Rotation position reset to 0. Next payment will start from gateway 1.',
    action: 'reset_position'
  });
}

async function changeRotationMode(supabase: any, clientId: string, mode: string) {
  if (!['round_robin', 'priority', 'smart'].includes(mode)) {
    return NextResponse.json({ 
      error: 'Invalid mode. Supported: round_robin, priority, smart' 
    }, { status: 400 });
  }

  const { error } = await supabase
    .from('clients')
    .update({ 
      rotation_mode: mode,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Rotation mode changed to ${mode}`,
    action: 'change_mode',
    new_mode: mode
  });
}

async function manualAdvancePosition(supabase: any, clientId: string, steps: number) {
  // Get current position and total gateways
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('current_rotation_position, total_assigned_gateways')
    .eq('id', clientId)
    .single();

  if (clientError) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (client.total_assigned_gateways === 0) {
    return NextResponse.json({ 
      error: 'No gateways assigned to this client' 
    }, { status: 400 });
  }

  // Calculate new position
  const newPosition = ((client.current_rotation_position + steps - 1) % client.total_assigned_gateways) + 1;

  const { error } = await supabase
    .from('clients')
    .update({ 
      current_rotation_position: newPosition,
      last_rotation_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Manually advanced rotation position by ${steps} step(s)`,
    action: 'manual_advance',
    old_position: client.current_rotation_position,
    new_position: newPosition,
    steps_advanced: steps
  });
}

async function toggleDailyReset(supabase: any, clientId: string, enabled: boolean) {
  const { error } = await supabase
    .from('clients')
    .update({ 
      rotation_reset_daily: enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Daily rotation reset ${enabled ? 'enabled' : 'disabled'}`,
    action: 'toggle_daily_reset',
    daily_reset_enabled: enabled
  });
}

async function toggleGatewayAssignment(supabase: any, clientId: string, gatewayId: string, isActive: boolean) {
  if (!gatewayId || isActive === undefined) {
    return NextResponse.json({ 
      error: 'gateway_id and is_active required' 
    }, { status: 400 });
  }

  // Update the client_gateway_assignments table
  const { error } = await supabase
    .from('client_gateway_assignments')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('client_id', clientId)
    .eq('gateway_id', gatewayId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert audit log
  await supabase
    .from('audit_logs')
    .insert({
      table_name: 'client_gateway_assignments',
      action: isActive ? 'ENABLE' : 'DISABLE',
      new_data: { 
        client_id: clientId, 
        gateway_id: gatewayId, 
        is_active: isActive 
      },
      user_id: 'admin',
      created_at: new Date().toISOString()
    });

  return NextResponse.json({ 
    success: true, 
    message: `Gateway assignment ${isActive ? 'enabled' : 'disabled'} successfully`,
    action: 'toggle_gateway_assignment',
    gateway_id: gatewayId,
    is_active: isActive
  });
} 