import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/gateways/[id] - Get gateway by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseService();
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key',
      process.env.ADMIN_API_KEY,
      process.env.NEXT_PUBLIC_ADMIN_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ gateway: data });
  } catch (err: any) {
    console.error('Gateway fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PUT /api/v1/admin/gateways/[id] - Update gateway
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseService();
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key',
      process.env.ADMIN_API_KEY,
      process.env.NEXT_PUBLIC_ADMIN_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const allowedFields = [
      'priority',
      'is_active',
      'monthly_limit',
      'current_volume',
      'credentials',
      'success_rate',
      'name',
      'provider',
      'api_key',
      'api_secret',
      'webhook_url',
      'webhook_secret',
      'environment',
      'channel_id',
      'auth_header',
      'additional_headers'
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Handle provider-specific credential logic
    if (body.provider) {
      const existingGateway = await supabase
        .from('payment_gateways')
        .select('credentials')
        .eq('id', params.id)
        .single();

      if (existingGateway.data) {
        const existingCredentials = existingGateway.data.credentials || {};
        const newCredentials = {
          ...existingCredentials,
          ...body.credentials
        };

        // Add provider-specific fields to credentials
        if (body.api_key) newCredentials.api_key = body.api_key;
        if (body.api_secret) newCredentials.api_secret = body.api_secret;
        if (body.webhook_url) newCredentials.webhook_url = body.webhook_url;
        if (body.webhook_secret) newCredentials.webhook_secret = body.webhook_secret;

        updateData.credentials = newCredentials;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payment_gateways')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      gateway: data,
      message: 'Gateway updated successfully with comprehensive credential support'
    });
  } catch (err: any) {
    console.error('Gateway update error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/**
 * PATCH /api/v1/admin/gateways/[id] - Partial update gateway
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return PUT(request, { params });
}

/**
 * DELETE /api/v1/admin/gateways/[id] - Delete gateway
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseService();
    // Enhanced API key validation
    const apiKey = request.headers.get('x-api-key');
    const validApiKeys = [
      'admin_test_key',
      process.env.ADMIN_API_KEY,
      process.env.NEXT_PUBLIC_ADMIN_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Gateway deleted successfully' });
  } catch (err: any) {
    console.error('Gateway delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 