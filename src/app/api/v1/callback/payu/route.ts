// PayU Webhook Handler
// This route handles PayU webhooks with hash verification

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { LightSpeedWrapper } from '@/lib/lightspeed-wrapper';
import { isWhitelistedIp } from '@/lib/ip-whitelist';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log('🔔 PayU webhook received');
  
  try {
    const allowedIps = (process.env.PAYU_WEBHOOK_IPS || '').split(',').map(i=>i.trim()).filter(Boolean);
    if (!isWhitelistedIp(req as any, allowedIps)) {
      return NextResponse.json({
        success:false,
        message:'Forbidden',
        gateway:'LightSpeed Payment Gateway'
      }, { status: 403 });
    }

    const formData = await req.formData();
    const payload: any = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      payload[key] = value.toString();
    }

    console.log('📦 Webhook payload:', {
      status: payload.status,
      txnid: payload.txnid,
      mihpayid: payload.mihpayid
    });

    const {
      status,
      txnid,
      amount,
      email,
      firstname,
      productinfo,
      hash: receivedHash,
      key,
      mihpayid
    } = payload;

    if (!txnid || !receivedHash) {
      return NextResponse.json({
        success: false,
        message: 'Invalid webhook payload',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 400 });
    }

    // Get PayU gateway configuration
    const { data: gateway, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('provider', 'payu')
      .eq('is_active', true)
      .single();

    if (gatewayError || !gateway) {
      console.error('❌ PayU gateway not found or inactive');
      return NextResponse.json({
        success: false,
        message: 'Gateway not configured',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 400 });
    }

    // Verify hash (reverse hash for PayU)
    const salt = gateway.api_secret || gateway.credentials?.salt || gateway.credentials?.merchant_salt;
    const hashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (receivedHash !== expectedHash) {
      console.error('❌ Hash verification failed');
      return NextResponse.json({
        success: false,
        message: 'Authentication failed',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 401 });
    }

    console.log('✅ Hash verification successful');

    // Find transaction
    const { data: transaction, error: txnError } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('id', txnid)
      .single();

    if (txnError || !transaction) {
      console.error('❌ Transaction not found:', txnid);
      return NextResponse.json({
        success: false,
        message: 'Transaction not found',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 404 });
    }

    // Map PayU status to system status
    let systemStatus = 'pending';
    switch (status?.toLowerCase()) {
      case 'success':
        systemStatus = 'paid';
        break;
      case 'failure':
      case 'failed':
        systemStatus = 'failed';
        break;
      case 'cancelled':
        systemStatus = 'cancelled';
        break;
      default:
        systemStatus = 'pending';
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('client_transactions')
      .update({
        status: systemStatus,
        gateway_txn_id: mihpayid || txnid,
        gateway_response: payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', txnid);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Update failed',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 500 });
    }

    console.log(`✅ Transaction ${txnid} updated to status: ${systemStatus}`);

    // Calculate commission if payment successful
    if (systemStatus === 'paid') {
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('fee_percent')
          .eq('id', transaction.client_id)
          .single();

        if (client && client.fee_percent) {
          const amountInPaisa = parseFloat(amount) * 100; // Convert to paisa
          const commissionAmount = Math.round((amountInPaisa * client.fee_percent) / 100);
          
          await supabase
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
      }
    }

    // Send client webhook notification if configured
    if (transaction.client_webhook_url) {
      try {
        const clientWebhookPayload = LightSpeedWrapper.sanitizeWebhookResponse(
          payload, 
          txnid, 
          parseFloat(amount) * 100 // Convert to paisa
        );

        await fetch(transaction.client_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LightSpeed-Signature': 'webhook-signature'
          },
          body: JSON.stringify(clientWebhookPayload)
        });

        console.log('✅ Client webhook notification sent');
      } catch (webhookError) {
        console.error('⚠️ Client webhook notification failed:', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      gateway: 'LightSpeed Payment Gateway'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal processing error',
      gateway: 'LightSpeed Payment Gateway'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 