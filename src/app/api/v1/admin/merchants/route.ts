import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { simpleAdminAuth } from '@/lib/simple-auth';

/**
 * GET /api/v1/admin/merchants
 * Returns a list of all merchants for admin dashboard selection.
 */
export async function GET(request: NextRequest) {
  const isAdmin = await simpleAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from('clients')
    .select('id, merchant_name')
    .order('merchant_name', { ascending: true });

  if (error) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
} 