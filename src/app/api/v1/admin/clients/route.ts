import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');

    let query = supabase
      .from('clients')
      .select(`
        id,
        created_at,
        company_name,
        contact_email,
        is_active,
        client_key,
        commission_wallets (
          balance_due
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }
    
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data: clients, error, count } = await query;

    if (error) throw new Error(error.message);

    return NextResponse.json({ 
      clients, 
      total: count,
      page,
      limit
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// POST /api/v1/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseService();
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_name, contact_email, is_active = true } = body;

    if (!company_name || !contact_email) {
      return NextResponse.json({ error: 'Company name and contact email are required' }, { status: 400 });
    }

    const client_key = `ls_${randomBytes(16).toString('hex')}`;
    const client_salt = randomBytes(32).toString('hex');

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        company_name,
        contact_email,
        client_key,
        client_salt,
        is_active,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create a default commission wallet
    await supabase
      .from('commission_wallets')
      .insert({
        client_id: client.id,
        balance_due: 0,
        warn_threshold: 10000,
        currency: 'INR',
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json(client);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 