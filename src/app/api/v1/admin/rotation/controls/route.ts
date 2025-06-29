import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/v1/admin/rotation/controls
 * Control rotation operations: reset, change mode, manual advance
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, client_id, params } = body;

    if (!action || !client_id) {
      return NextResponse.json({ 
        error: 'action and client_id required' 
      }, { status: 400 });
    }

    switch (action) {
      case 'reset_position':
        return await resetRotationPosition(client_id);
      
      case 'change_mode':
        return await changeRotationMode(client_id, params?.mode);
      
      case 'manual_advance':
        return await manualAdvancePosition(client_id, params?.steps || 1);
      
      case 'toggle_daily_reset':
        return await toggleDailyReset(client_id, params?.enabled);
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported: reset_position, change_mode, manual_advance, toggle_daily_reset' 
        }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function resetRotationPosition(clientId: string) {
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

async function changeRotationMode(clientId: string, mode: string) {
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

async function manualAdvancePosition(clientId: string, steps: number) {
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

async function toggleDailyReset(clientId: string, enabled: boolean) {
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