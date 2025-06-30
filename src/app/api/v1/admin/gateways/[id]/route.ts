import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

const supabase = getSupabaseService();

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
<<<<<<< HEAD
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
=======
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key', 
      process.env.ADMIN_API_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ].filter(Boolean);
    
    if (!validApiKeys.includes(apiKey || '')) {
>>>>>>> 6b1b07c04742caa4c3c5916df73816499b810376
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getGatewayId(request);
    if (!id) return NextResponse.json({ error: 'Invalid gateway id' }, { status: 400 });

    const body = await request.json();
    
    // Expanded list of allowed fields for comprehensive gateway configuration
    const allowed = [
      'priority',
      'is_active',
      'monthly_limit',
      'credentials',
      'success_rate',
      'name',
<<<<<<< HEAD
      'api_endpoint_url',
=======
      'provider',
      'api_key',
      'api_secret',
      'webhook_url',
      'webhook_secret',
      'client_id',
      'api_id',
      'api_endpoint_url',
      'environment',
      'channel_id',
      'auth_header',
      'additional_headers',
>>>>>>> 6b1b07c04742caa4c3c5916df73816499b810376
    ];
    
    const updateData: Record<string, any> = {};
    
    // Handle standard fields
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
<<<<<<< HEAD
    
    // Handle api_endpoint_url specially - store it in credentials JSON
    if (body.api_endpoint_url !== undefined) {
      // Get current gateway to merge with existing credentials
      const { data: currentGateway } = await supabase
        .from('payment_gateways')
        .select('credentials')
        .eq('id', id)
        .single();
      
      const existingCredentials = currentGateway?.credentials || {};
      updateData.credentials = {
        ...existingCredentials,
        api_endpoint_url: body.api_endpoint_url
      };
      delete updateData.api_endpoint_url; // Remove from direct column update
    }
    
=======

    // Handle provider-specific credential logic
    if (body.provider) {
      let gatewayCredentials = body.credentials || {};
      
      if (body.provider === 'custom') {
        gatewayCredentials = {
          ...gatewayCredentials,
          ...(body.client_id && { client_id: body.client_id }),
          ...(body.api_id && { api_id: body.api_id }),
          ...(body.api_secret && { api_secret: body.api_secret }),
          ...(body.api_endpoint_url && { api_endpoint_url: body.api_endpoint_url }),
          ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
          ...(body.additional_headers && { additional_headers: typeof body.additional_headers === 'string' ? JSON.parse(body.additional_headers) : body.additional_headers }),
        };
      } else {
        gatewayCredentials = {
          ...gatewayCredentials,
          ...(body.api_key && { api_key: body.api_key }),
          ...(body.api_secret && { api_secret: body.api_secret }),
          ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
          ...(body.environment && ['phonepe', 'cashfree'].includes(body.provider) && { environment: body.environment }),
          ...(body.channel_id && body.provider === 'paytm' && { channel_id: body.channel_id }),
          ...(body.auth_header && body.provider === 'payu' && { auth_header: body.auth_header }),
        };
      }
      
      updateData.credentials = gatewayCredentials;
    }

    // Handle additional_headers JSON parsing
    if (body.additional_headers && typeof body.additional_headers === 'string') {
      try {
        updateData.additional_headers = JSON.parse(body.additional_headers);
      } catch (e) {
        updateData.additional_headers = { raw: body.additional_headers };
      }
    }

>>>>>>> 6b1b07c04742caa4c3c5916df73816499b810376
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

    return NextResponse.json({ 
      gateway: data,
      message: 'Gateway updated successfully with comprehensive credential support'
    });
  } catch (err: any) {
    console.error('Gateway update error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PATCH method - same as PUT for partial updates
export async function PATCH(request: NextRequest) {
  try {
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key', 
      process.env.ADMIN_API_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ].filter(Boolean);
    
    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getGatewayId(request);
    if (!id) return NextResponse.json({ error: 'Invalid gateway id' }, { status: 400 });

    const body = await request.json();
    
    // Expanded list of allowed fields for comprehensive gateway configuration
    const allowed = [
      'priority',
      'is_active',
      'monthly_limit',
      'credentials',
      'success_rate',
      'name',
      'provider',
      'api_key',
      'api_secret',
      'webhook_url',
      'webhook_secret',
      'client_id',
      'api_id',
      'api_endpoint_url',
      'environment',
      'channel_id',
      'auth_header',
      'additional_headers',
    ];
    
    const updateData: Record<string, any> = {};
    
    // Handle standard fields
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Handle provider-specific credential logic
    if (body.provider) {
      let gatewayCredentials = body.credentials || {};
      
      if (body.provider === 'custom') {
        gatewayCredentials = {
          ...gatewayCredentials,
          ...(body.client_id && { client_id: body.client_id }),
          ...(body.api_id && { api_id: body.api_id }),
          ...(body.api_secret && { api_secret: body.api_secret }),
          ...(body.api_endpoint_url && { api_endpoint_url: body.api_endpoint_url }),
          ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
          ...(body.additional_headers && { additional_headers: typeof body.additional_headers === 'string' ? JSON.parse(body.additional_headers) : body.additional_headers }),
        };
      } else {
        gatewayCredentials = {
          ...gatewayCredentials,
          ...(body.api_key && { api_key: body.api_key }),
          ...(body.api_secret && { api_secret: body.api_secret }),
          ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
          ...(body.environment && ['phonepe', 'cashfree'].includes(body.provider) && { environment: body.environment }),
          ...(body.channel_id && body.provider === 'paytm' && { channel_id: body.channel_id }),
          ...(body.auth_header && body.provider === 'payu' && { auth_header: body.auth_header }),
        };
      }
      
      updateData.credentials = gatewayCredentials;
    }

    // Handle additional_headers JSON parsing
    if (body.additional_headers && typeof body.additional_headers === 'string') {
      try {
        updateData.additional_headers = JSON.parse(body.additional_headers);
      } catch (e) {
        updateData.additional_headers = { raw: body.additional_headers };
      }
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

    return NextResponse.json({ 
      gateway: data,
      message: 'Gateway updated successfully via PATCH'
    });
  } catch (err: any) {
    console.error('Gateway PATCH update error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// Delete gateway (soft delete -> is_active=false)
export async function DELETE(request: NextRequest) {
  try {
<<<<<<< HEAD
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
=======
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key', 
      process.env.ADMIN_API_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ].filter(Boolean);
    
    if (!validApiKeys.includes(apiKey || '')) {
>>>>>>> 6b1b07c04742caa4c3c5916df73816499b810376
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Enhanced API key validation
  const apiKey = request.headers.get('x-api-key');
  const validApiKeys = [
    'admin_test_key', 
    process.env.ADMIN_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ].filter(Boolean);
  
  if (!validApiKeys.includes(apiKey || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from('payment_gateways')
      .select(`
        *,
        webhook_url,
        webhook_secret,
        environment,
        channel_id,
        auth_header,
        additional_headers,
        client_id,
        api_id
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 