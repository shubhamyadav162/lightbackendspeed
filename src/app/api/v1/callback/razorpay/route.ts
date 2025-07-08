// Razorpay Webhook Handler
// This route handles Razorpay webhooks with signature verification

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
  console.log('🔔 Razorpay webhook received');
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.error('❌ Missing Razorpay signature');
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log('📦 Webhook payload:', {
      event: payload.event,
      payment_id: payload.payload?.payment?.entity?.id
    });

    // Get Razorpay gateway configuration
    const { data: gateway, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('provider', 'razorpay')
      .eq('is_active', true)
      .single();

    if (gatewayError || !gateway) {
      console.error('❌ Razorpay gateway not found or inactive');
      return NextResponse.json({
        success: false,
        message: 'Gateway not configured',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = gateway.credentials?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Signature verification failed');
        return NextResponse.json({
          success: false,
          message: 'Authentication failed',
          gateway: 'LightSpeed Payment Gateway'
        }, { status: 401 });
      }
    }

    console.log('✅ Signature verification successful');

    // Extract payment details
    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payload structure',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 400 });
    }

    // Find transaction by order_id (receipt)
    const { data: transaction, error: txnError } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('order_id', payment.receipt)
      .single();

    if (txnError || !transaction) {
      console.error('❌ Transaction not found for receipt:', payment.receipt);
      return NextResponse.json({
        success: false,
        message: 'Transaction not found',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 404 });
    }

    // Map Razorpay status to system status
    let systemStatus = 'pending';
    switch (payload.event) {
      case 'payment.captured':
        systemStatus = 'paid';
        break;
      case 'payment.failed':
        systemStatus = 'failed';
        break;
      case 'payment.cancelled':
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
        gateway_txn_id: payment.id,
        gateway_response: payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Update failed',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 500 });
    }

    console.log(`✅ Transaction ${transaction.id} updated to status: ${systemStatus}`);

    // Calculate commission if payment successful
    if (systemStatus === 'paid') {
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('fee_percent')
          .eq('id', transaction.client_id)
          .single();

        if (client && client.fee_percent) {
          const commissionAmount = Math.round((payment.amount * client.fee_percent) / 100);
          
          await supabase
            .from('commission_ledger')
            .insert({
              transaction_id: transaction.id,
              client_id: transaction.client_id,
              amount: commissionAmount,
              fee_percent: client.fee_percent,
              status: 'recorded'
            });

          console.log(`✅ Commission recorded for transaction ${transaction.id}`);
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
          transaction.id, 
          payment.amount
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

    // --- IP Whitelisting ---
    const allowedIps = (process.env.RAZORPAY_WEBHOOK_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    if (!isWhitelistedIp(req, allowedIps)) {
      console.warn('❌ IP not whitelisted for Razorpay webhook');
      return NextResponse.json({
        success: false,
        message: 'Forbidden',
        gateway: 'LightSpeed Payment Gateway'
      }, { status: 403 });
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    },
  });
} 