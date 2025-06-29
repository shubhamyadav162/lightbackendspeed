import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Demo Data Setup API
 * POST /api/v1/admin/demo - Add demo clients and data for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Dynamic import to avoid build-time issues
    const { getSupabaseService } = await import('@/lib/supabase/server');
    
    // Setup demo clients and assignments
    const demoData = await setupDemoData(getSupabaseService);
    
    return NextResponse.json({
      success: true,
      message: 'Demo data setup completed successfully',
      data: demoData
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json(
      { error: 'Demo setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function setupDemoData(getSupabaseService: () => any) {
  const supabase = getSupabaseService();
  
  // 1. Create demo clients
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .upsert([
      {
        id: '11111111-2222-3333-4444-555555555555',
        client_key: 'LSP_GAMING_PLATFORM_2025',
        client_salt: 'salt_gaming_secure_2025_xyz789',
        company_name: 'Gaming World India Pvt Ltd',
        webhook_url: 'https://api.gamingworld.in/webhook/payment-update',
        fee_percent: 3.50,
        suspend_threshold: 15000,
        status: 'active',
        rotation_mode: 'round_robin',
        current_rotation_position: 0,
        total_assigned_gateways: 0,
        rotation_reset_daily: true
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        client_key: 'LSP_ECOMMERCE_STORE_2025',
        client_salt: 'salt_ecom_secure_2025_abc123',
        company_name: 'ShopKart Online Solutions',
        webhook_url: 'https://api.shopkart.com/payments/webhook',
        fee_percent: 4.00,
        suspend_threshold: 20000,
        status: 'active',
        rotation_mode: 'round_robin',
        current_rotation_position: 0,
        total_assigned_gateways: 0,
        rotation_reset_daily: true
      }
    ], { onConflict: 'client_key' });

  if (clientError) {
    throw new Error(`Client setup failed: ${clientError.message}`);
  }

  // 2. Get available payment gateways
  const { data: gateways, error: gatewayError } = await supabase
    .from('payment_gateways')
    .select('id, name, provider')
    .eq('is_active', true)
    .limit(6);

  if (gatewayError || !gateways || gateways.length === 0) {
    throw new Error('No active gateways found for assignment');
  }

  // 3. Assign gateways to demo clients
  const assignments = [];
  
  // Gaming client - first 3 gateways
  for (let i = 0; i < Math.min(3, gateways.length); i++) {
    assignments.push({
      client_id: '11111111-2222-3333-4444-555555555555',
      gateway_id: gateways[i].id,
      rotation_order: i + 1,
      is_active: true,
      weight: 1.0,
      daily_limit: 800000
    });
  }

  // Ecommerce client - next 3 gateways (or overlap if not enough)
  const ecomGateways = gateways.slice(2, 5).length > 0 ? gateways.slice(2, 5) : gateways.slice(0, 3);
  for (let i = 0; i < ecomGateways.length; i++) {
    assignments.push({
      client_id: '22222222-3333-4444-5555-666666666666',
      gateway_id: ecomGateways[i].id,
      rotation_order: i + 1,
      is_active: true,
      weight: 1.0,
      daily_limit: 1000000
    });
  }

  const { error: assignmentError } = await supabase
    .from('client_gateway_assignments')
    .upsert(assignments, { onConflict: 'client_id,gateway_id' });

  if (assignmentError) {
    throw new Error(`Gateway assignment failed: ${assignmentError.message}`);
  }

  // 4. Update client gateway counts
  await supabase
    .from('clients')
    .update({ total_assigned_gateways: 3 })
    .in('id', ['11111111-2222-3333-4444-555555555555', '22222222-3333-4444-5555-666666666666']);

  // 5. Create commission wallets
  await supabase
    .from('commission_wallets')
    .upsert([
      {
        id: '11111111-1111-1111-1111-111111111111',
        client_id: '11111111-2222-3333-4444-555555555555',
        balance_due: 8750,
        warn_threshold: 5000
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        client_id: '22222222-3333-4444-5555-666666666666',
        balance_due: 12400,
        warn_threshold: 8000
      }
    ], { onConflict: 'client_id' });

  return {
    clients: 2, // We always create exactly 2 demo clients
    gateways: gateways.length,
    assignments: assignments.length,
    wallets: 2
  };
}

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time issues
    const { getSupabaseService } = await import('@/lib/supabase/server');
    const supabase = getSupabaseService();
    
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, rotation_mode, current_rotation_position, total_assigned_gateways')
      .like('id', 'client-demo-%');

    if (clientError) throw clientError;

    const { data: gateways, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('id, name, provider, success_rate, is_active')
      .in('id', [
        'a1b2c3d4-e5f6-7890-abcd-123456789001',
        'a1b2c3d4-e5f6-7890-abcd-123456789002',
        'a1b2c3d4-e5f6-7890-abcd-123456789003',
        'a1b2c3d4-e5f6-7890-abcd-123456789004',
        'a1b2c3d4-e5f6-7890-abcd-123456789005'
      ]);

    if (gatewayError) throw gatewayError;

    return NextResponse.json({
      success: true,
      demo_data_exists: (clients?.length || 0) > 0,
      clients: clients || [],
      gateways: gateways || []
    });

  } catch (error: any) {
    console.error('❌ Demo check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check demo data',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 