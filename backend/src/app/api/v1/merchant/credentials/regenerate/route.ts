// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSupabaseService, getAuthContext } from '@/lib/supabase/server';

/**
 * POST /api/v1/merchant/credentials/regenerate
 * Generates new client_key + salt for merchant and invalidates old one.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Merchants can regenerate their own key; admins can regenerate by merchantId query param
  const merchantId = auth.role === 'merchant' ? auth.merchantId : request.nextUrl.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id_required' }, { status: 400 });
  }

  const newKey = randomBytes(16).toString('hex'); // 32 chars
  const newSalt = randomBytes(32).toString('hex'); // 64 chars

  const supabase = getSupabaseService();
  const { error } = await supabase
    .from('clients')
    .update({ client_key: newKey, client_salt: newSalt, updated_at: new Date().toISOString() })
    .eq('id', merchantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client_key: newKey, client_salt: newSalt });
} 