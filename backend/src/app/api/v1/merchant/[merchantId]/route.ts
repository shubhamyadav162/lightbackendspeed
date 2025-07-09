import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const { merchantId } = params;

  try {
    // Auth: allow admin or the same merchant
    const authCtx = await getAuthContext(request);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authCtx.role === 'merchant' && authCtx.merchantId !== merchantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Merchant not found');
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 