import { NextRequest, NextResponse } from 'next/server';
import { simpleAdminAuth, simpleError, simpleResponse } from '@/lib/simple-auth';
import { getSupabaseService } from '@/lib/supabase/server';
import { encryptSensitiveFields } from '@/lib/gateway-crypto';

// Force dynamic rendering to prevent static generation timeout
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/gateways
 * Returns a list of all payment gateways with metadata / health indicators.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [ADMIN] Listing gateways...');
    
    // Simple admin authentication
    const isAuthorized = await simpleAdminAuth(request);
    console.log('🔑 [ADMIN] Authorization check passed:', isAuthorized);
    if (!isAuthorized) {
      return simpleError('Unauthorized - Invalid admin API key', 401);
    }

    const supabase = getSupabaseService();
    const { data: gateways, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: true });
    
    console.log('🔍 [ADMIN] Supabase query executed.');

    if (error) {
      console.error('❌ [ADMIN] Failed to fetch gateways from Supabase:', error);
      return simpleError('Failed to fetch gateways', 500);
    }

    console.log('✅ [ADMIN] Found', gateways.length, 'gateways from DB.');
    console.log('📦 [ADMIN] Sending gateways to frontend:', JSON.stringify(gateways.map(g => ({id: g.id, name: g.name, provider: g.provider})), null, 2));

    return simpleResponse({ success: true, data: gateways });

  } catch (error) {
    console.error('❌ [ADMIN] Error fetching gateways:', error);
    return simpleError('Internal server error', 500);
  }
}

/**
 * POST /api/v1/admin/gateways
 * Body: {
 *   name: string,
 *   provider: string,
 *   credentials: object,
 *   api_key?: string,
 *   api_secret?: string,
 *   webhook_url?: string,
 *   webhook_secret?: string,
 *   client_id?: string,
 *   api_id?: string,
 *   api_endpoint_url?: string,
 *   environment?: string,
 *   channel_id?: string,
 *   auth_header?: string,
 *   additional_headers?: string,
 *   monthly_limit?: number,
 *   priority?: number,
 *   is_active?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('➕ [ADMIN] Creating new gateway...');
    
    // Simple admin authentication
    const isAuthorized = await simpleAdminAuth(request);
    if (!isAuthorized) {
      return simpleError('Unauthorized - Invalid admin API key', 401);
    }

    const body = await request.json();
    console.log('📋 [ADMIN] Gateway data:', body);

    // Validate required fields
    if (!body.name || !body.provider) {
      return simpleError('Name and provider are required', 400);
    }

    const supabase = getSupabaseService();
    
    // Encrypt credentials before saving
    const encryptedCreds = encryptSensitiveFields(body.credentials || {});

    // Create gateway
    const { data: gateway, error } = await supabase
      .from('payment_gateways')
      .insert({
        name: body.name,
        provider: body.provider,
        credentials: encryptedCreds,
        is_active: body.is_active || true,
        priority: body.priority || 1,
        webhook_url: body.webhook_url,
        webhook_secret: body.webhook_secret,
        environment: body.environment || 'test'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [ADMIN] Failed to create gateway:', error);
      return simpleError('Failed to create gateway', 500);
    }

    console.log('✅ [ADMIN] Gateway created:', gateway.name);
    return simpleResponse({ success: true, data: gateway });

  } catch (error) {
    console.error('❌ [ADMIN] Error creating gateway:', error);
    return simpleError('Internal server error', 500);
  }
} 