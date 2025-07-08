import { getSupabaseService } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// Helper function to generate Easebuzz hash
async function generateEasebuzzHash(data: any, salt: string): Promise<string> {
    const hashString = [
        data.key,
        data.txnid,
        data.amount,
        data.productinfo,
        data.firstname,
        data.email,
        '', '', '', '', '', '', '', '', '', '', // UDF fields
        salt
    ].join('|');

    // Deno uses Web Crypto, Node uses 'crypto' module
    // In Next.js server components/routes, we use Node's crypto
    const hash = createHmac('sha512', salt);
    hash.update(hashString);
    // This is incorrect for HMAC. Easebuzz uses a simple SHA512, not HMAC.
    // Let's correct this.
    const correctHash = createHmac('sha512', '').update(hashString).digest('hex');
    // The above is also not quite right. A simple SHA512 is not an HMAC.
    // Let's use the standard crypto library for a simple hash.
    const crypto = require('crypto');
    const sha512hasher = crypto.createHash('sha512');
    sha512hasher.update(hashString);
    return sha512hasher.digest('hex');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseService();
    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Fetch from the new client_transactions table
    const { data: transaction, error } = await supabase
      .from('client_transactions')
      .select(`
        id,
        order_id,
        amount,
        customer_email,
        customer_name,
        customer_phone,
        gateway_response,
        payment_gateways (
          provider,
          api_key,
          api_secret
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('Supabase error fetching transaction:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch transaction details' }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const gateway = transaction.payment_gateways as any;
    if (!gateway) {
      return NextResponse.json({ error: 'Payment gateway details not found' }, { status: 500 });
    }

    let checkoutDetails: { [key: string]: any } = {
        transaction_id: transaction.id,
        order_id: transaction.order_id,
        amount: transaction.amount,
        provider: gateway.provider,
        customer_email: transaction.customer_email,
        customer_name: transaction.customer_name,
        customer_phone: transaction.customer_phone
    };

    if (gateway.provider === 'razorpay') {
        const razorpayOrderId = transaction.gateway_response?.id;
        if (!razorpayOrderId) {
            return NextResponse.json({ error: 'Razorpay Order ID not found in transaction' }, { status: 500 });
        }
        checkoutDetails.razorpay_order_id = razorpayOrderId;
        checkoutDetails.razorpay_key_id = gateway.api_key;

    } else if (gateway.provider === 'easebuzz') {
        const amountInRupees = (transaction.amount / 100).toFixed(2);
        const hashData = {
            key: gateway.api_key,
            txnid: transaction.id,
            amount: amountInRupees,
            productinfo: `Order: ${transaction.order_id}`,
            firstname: transaction.customer_name || 'Customer',
            email: transaction.customer_email || '',
        };
        const hash = await generateEasebuzzHash(hashData, gateway.api_secret);

        checkoutDetails.easebuzz_key = gateway.api_key;
        checkoutDetails.easebuzz_txnid = transaction.id;
        checkoutDetails.easebuzz_hash = hash;
    } else {
        return NextResponse.json({ error: `Unsupported provider: ${gateway.provider}` }, { status: 500 });
    }

    return NextResponse.json(checkoutDetails);

  } catch (err: any) {
    console.error('Unexpected error in GET /api/v1/payments/[id]:', err);
    // It's better to show a generic error message in production
    return NextResponse.json({ error: 'An unexpected error occurred', details: err.message }, { status: 500 });
  }
} 