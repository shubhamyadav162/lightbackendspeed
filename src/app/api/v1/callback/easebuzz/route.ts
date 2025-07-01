import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import crypto from 'crypto';

// POST /api/v1/callback/easebuzz - Easebuzz production webhook callback (NextGen Techno)
export async function POST(request: NextRequest) {
  // Re-use same implementation as /easebuzzp but reading active production gateway
  try {
    console.log('🔔 Easebuzz (prod) webhook received');
    const payload = await request.json();
    console.log('📦 Payload:', payload);

    const {
      status,
      txnid,
      amount,
      email,
      firstname,
      productinfo,
      hash: receivedHash,
      key,
      easepayid
    } = payload;

    if (!txnid || !receivedHash) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Fetch active production gateway record by id to ensure we get correct creds
    const { data: gateway } = await supabaseService
      .from('payment_gateways')
      .select('*')
      .eq('id', '2fc79b96-36a3-4a67-ab21-94ce961600b8')
      .eq('is_active', true)
      .single();

    if (!gateway) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 400 });
    }

    const salt = (gateway.credentials as any).api_secret;
    if (!salt) {
      return NextResponse.json({ error: 'Gateway misconfigured' }, { status: 500 });
    }

    const hashString = [
      salt,
      status || '',
      '', '', '', '', '', '', '',
      email || '',
      firstname || '',
      productinfo || '',
      amount || '',
      txnid || '',
      key || ''
    ].join('|');
    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (receivedHash !== expectedHash) {
      console.error('Hash mismatch');
      return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
    }

    // reuse transaction update logic by importing function? quick copy from previous file
    const { data: transaction } = await supabaseService
      .from('client_transactions')
      .select('*')
      .eq('id', txnid)
      .single();

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    let systemStatus: string;
    switch ((status || '').toLowerCase()) {
      case 'success':
        systemStatus = 'paid';
        break;
      case 'failed':
      case 'failure':
        systemStatus = 'failed';
        break;
      case 'usercancel':
        systemStatus = 'cancelled';
        break;
      default:
        systemStatus = 'pending';
    }

    const { error: updateError } = await supabaseService
      .from('client_transactions')
      .update({
        status: systemStatus,
        gateway_txn_id: easepayid || txnid,
        gateway_response: {
          ...transaction.gateway_response,
          webhook: payload
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', txnid);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Easebuzz prod webhook active' });
} 