import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import crypto from 'crypto';

// POST /api/v1/callback/easebuzzp - Easebuzz webhook callback
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Easebuzz webhook received');

    // Parse the webhook payload
    const payload = await request.json();
    console.log('📦 Webhook payload:', payload);

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
      console.error('❌ Invalid webhook payload - missing required fields');
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Get gateway configuration for Easebuzz
    if (!supabaseService) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { data: gateway, error: gatewayError } = await supabaseService
      .from('payment_gateways')
      .select('*')
      .eq('provider', 'easebuzz')
      .eq('is_active', true)
      .single();

    if (gatewayError || !gateway) {
      console.error('❌ Easebuzz gateway not found or inactive');
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 400 });
    }

    // Extract salt from credentials
    const credentials = gateway.credentials as any;
    const salt = credentials.api_secret || credentials.salt;

    if (!salt) {
      console.error('❌ Easebuzz salt not found in gateway configuration');
      return NextResponse.json({ error: 'Gateway misconfigured' }, { status: 500 });
    }

    // Verify hash - Easebuzz uses reverse hash for webhook
    // Reverse hash format: salt|status|||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = [
      salt,
      status || '',
      '', '', '', '', '', '', '', // UDF fields (empty in reverse)
      email || '',
      firstname || '',
      productinfo || '',
      amount || '',
      txnid || '',
      key || ''
    ].join('|');

    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (receivedHash !== expectedHash) {
      console.error('❌ Hash verification failed');
      console.log('Expected hash:', expectedHash);
      console.log('Received hash:', receivedHash);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    console.log('✅ Hash verification successful');

    // Find the transaction
    const { data: transaction, error: txnError } = await supabaseService
      .from('client_transactions')
      .select('*')
      .eq('id', txnid)
      .single();

    if (txnError || !transaction) {
      console.error('❌ Transaction not found:', txnid);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Map Easebuzz status to our system status
    let systemStatus = 'pending';
    switch (status?.toLowerCase()) {
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

    // Update transaction
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
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    console.log(`✅ Transaction ${txnid} updated to status: ${systemStatus}`);

    // If payment successful, calculate commission
    if (systemStatus === 'paid') {
      try {
        // Get client info for commission calculation
        const { data: client } = await supabaseService
          .from('clients')
          .select('fee_percent')
          .eq('id', transaction.client_id)
          .single();

        if (client && client.fee_percent) {
          // Calculate commission (you might have a utility function for this)
          const commissionAmount = Math.round((transaction.amount * client.fee_percent) / 100);
          
          // Record commission
          await supabaseService
            .from('commission_ledger')
            .insert({
              transaction_id: txnid,
              client_id: transaction.client_id,
              amount: commissionAmount,
              fee_percent: client.fee_percent,
              status: 'recorded'
            });

          console.log(`✅ Commission recorded for transaction ${txnid}`);
        }
      } catch (commissionError) {
        console.error('⚠️ Commission calculation failed:', commissionError);
        // Don't fail the webhook for commission errors
      }
    }

    // Send notification to client webhook if configured
    if (transaction.client_webhook_url) {
      try {
        await fetch(transaction.client_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LightSpeed-Signature': 'webhook-signature' // Add proper signature
          },
          body: JSON.stringify({
            transaction_id: txnid,
            status: systemStatus,
            amount: transaction.amount,
            gateway: 'LightSpeed Payment Gateway',
            processed_at: new Date().toISOString()
          })
        });
        console.log('✅ Client webhook notification sent');
      } catch (webhookError) {
        console.error('⚠️ Client webhook notification failed:', webhookError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Easebuzz webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 