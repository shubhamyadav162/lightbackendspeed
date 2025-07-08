import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { simpleAdminAuth } from '@/lib/simple-auth';

/**
 * GET /api/v1/merchant/credentials/history
 * Retrieves the credential generation history for a specific merchant.
 * Admin-only. Requires merchantId as a query parameter.
 */
export async function GET(request: NextRequest) {
  const isAdmin = await simpleAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId query parameter is required' }, { status: 400 });
  }

  if (!supabaseService) {
    return NextResponse.json({ error: 'Database service not available' }, { status: 500 });
  }

  const { data, error } = await supabaseService
    .from('credential_history')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching credential history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
} 