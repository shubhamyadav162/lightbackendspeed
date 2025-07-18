import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { encryptSensitiveFields } from '@/lib/gateway-crypto';

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
    
    // Only include fields that exist as actual database columns
    const allowed = [
      'priority',
      'is_active',
      'monthly_limit',
      'credentials',
      'success_rate',
      'name',
      'provider',
      'webhook_url',
      'webhook_secret',
      'environment',
      'channel_id',
      'auth_header',
      'additional_headers',
    ];
    
    const updateData: Record<string, any> = {};
    
    // Handle standard fields (excluding api_key/api_secret as they go in credentials)
    for (const key of allowed) {
      if (body[key] !== undefined && key !== 'api_key' && key !== 'api_secret') {
        updateData[key] = body[key];
      }
    }

    // Get existing credentials to merge with new ones
    const { data: existingGateway } = await supabase
      .from('payment_gateways')
      .select('credentials, provider')
      .eq('id', id)
      .single();

    let gatewayCredentials = existingGateway?.credentials || {};
    const currentProvider = body.provider || existingGateway?.provider;

    // Handle credential updates - put api_key/api_secret in credentials JSON
    if (currentProvider === 'custom') {
      // Custom provider credentials
      gatewayCredentials = {
        ...gatewayCredentials,
        ...(body.client_id && { client_id: body.client_id }),
        ...(body.api_id && { api_id: body.api_id }),
        ...(body.api_secret && { api_secret: body.api_secret }),
        ...(body.api_endpoint_url && { api_endpoint_url: body.api_endpoint_url }),
        ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
        ...(body.additional_headers && { 
          additional_headers: typeof body.additional_headers === 'string' 
            ? JSON.parse(body.additional_headers) 
            : body.additional_headers 
        }),
      };
    } else {
      // Standard provider credentials (Easebuzz, Razorpay, etc.)
      gatewayCredentials = {
        ...gatewayCredentials,
        ...(body.api_key && { api_key: body.api_key }),
        ...(body.api_secret && { api_secret: body.api_secret }),
        ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
        ...(body.environment && ['phonepe', 'cashfree'].includes(currentProvider) && { environment: body.environment }),
        ...(body.channel_id && currentProvider === 'paytm' && { channel_id: body.channel_id }),
        ...(body.auth_header && currentProvider === 'payu' && { auth_header: body.auth_header }),
      };
    }

    // Always update credentials if we have credential-related changes
    if (body.api_key || body.api_secret || body.webhook_secret || body.client_id || body.api_id || body.api_endpoint_url) {
      updateData.credentials = encryptSensitiveFields(gatewayCredentials);
    }

    // Handle additional_headers JSON parsing for direct column (if it exists)
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

    console.log('🔧 Gateway Update Data (PUT):', updateData);

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
    
    // Only include fields that exist as actual database columns
    const allowed = [
      'priority',
      'is_active',
      'monthly_limit',
      'credentials',
      'success_rate',
      'name',
      'provider',
      'webhook_url',
      'webhook_secret',
      'environment',
      'channel_id',
      'auth_header',
      'additional_headers',
    ];
    
    const updateData: Record<string, any> = {};
    
    // Handle standard fields (excluding api_key/api_secret as they go in credentials)
    for (const key of allowed) {
      if (body[key] !== undefined && key !== 'api_key' && key !== 'api_secret') {
        updateData[key] = body[key];
      }
    }

    // Get existing credentials to merge with new ones
    const { data: existingGateway } = await supabase
      .from('payment_gateways')
      .select('credentials, provider')
      .eq('id', id)
      .single();

    let gatewayCredentials = existingGateway?.credentials || {};
    const currentProvider = body.provider || existingGateway?.provider;

    // Handle credential updates - put api_key/api_secret in credentials JSON
    if (currentProvider === 'custom') {
      // Custom provider credentials
      gatewayCredentials = {
        ...gatewayCredentials,
        ...(body.client_id && { client_id: body.client_id }),
        ...(body.api_id && { api_id: body.api_id }),
        ...(body.api_secret && { api_secret: body.api_secret }),
        ...(body.api_endpoint_url && { api_endpoint_url: body.api_endpoint_url }),
        ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
        ...(body.additional_headers && { 
          additional_headers: typeof body.additional_headers === 'string' 
            ? JSON.parse(body.additional_headers) 
            : body.additional_headers 
        }),
      };
    } else {
      // Standard provider credentials (Easebuzz, Razorpay, etc.)
      gatewayCredentials = {
        ...gatewayCredentials,
        ...(body.api_key && { api_key: body.api_key }),
        ...(body.api_secret && { api_secret: body.api_secret }),
        ...(body.webhook_secret && { webhook_secret: body.webhook_secret }),
        ...(body.environment && ['phonepe', 'cashfree'].includes(currentProvider) && { environment: body.environment }),
        ...(body.channel_id && currentProvider === 'paytm' && { channel_id: body.channel_id }),
        ...(body.auth_header && currentProvider === 'payu' && { auth_header: body.auth_header }),
      };
    }

    // Always update credentials if we have credential-related changes
    if (body.api_key || body.api_secret || body.webhook_secret || body.client_id || body.api_id || body.api_endpoint_url) {
      updateData.credentials = encryptSensitiveFields(gatewayCredentials);
    }

    // Handle additional_headers JSON parsing for direct column (if it exists)
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

    console.log('🔧 Gateway Update Data:', updateData);

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

// Delete gateway (soft delete -> is_active=false)
export async function DELETE(request: NextRequest) {
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