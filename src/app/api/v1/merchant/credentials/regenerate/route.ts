// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseService, getAuthContext } from '@/lib/supabase/server';
import { simpleAdminAuth } from '@/lib/simple-auth';

/**
 * POST /api/v1/merchant/credentials/regenerate
 * Generates new client_key + salt for merchant and invalidates old one.
 * Admin-only. Requires merchantId in the request body.
 */
export async function POST(request: NextRequest) {
  const isAdmin = await simpleAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let merchantId: string | null = null;
  let label: string | null = null;
  try {
    const body = await request.json();
    merchantId = body.merchantId;
    label = body.label;
  } catch (e) {
    // Ignore error if body is empty or not json
  }

  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id_required' }, { status: 400 });
  }

  const newKey = `lsp_${crypto.randomBytes(12).toString('hex')}`;
  const newSalt = crypto.randomBytes(32).toString('hex');

  // Call the new transactional function
  const { error: rpcError } = await supabaseService.rpc('regenerate_and_log_credentials', {
    p_merchant_id: merchantId,
    p_label: label || 'Credentials regenerated without label',
    p_new_client_key: newKey,
    p_new_client_salt: newSalt,
  });

  if (rpcError) {
    console.error('RPC Error regenerating credentials:', rpcError);
    return NextResponse.json({ error: `Failed to regenerate credentials: ${rpcError.message}` }, { status: 500 });
  }

  // Fetch other client data for the response after successful regeneration
  const { data, error } = await supabaseService
    .from('clients')
    .select('webhook_url, fee_percent, usage_rate_limit')
    .eq('id', merchantId)
    .single();

  if (error) {
    // This is unlikely but possible if the client was deleted between calls
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also mask the newly generated key for the response
  const maskedKey = newKey.replace(/.(?=.{4})/g, '*');

  return NextResponse.json({
    success: true,
    data: {
      client_key: maskedKey,
      webhook_url: data.webhook_url,
      fee_percent: data.fee_percent,
      rate_limit: data.usage_rate_limit,
    }
  });
} 