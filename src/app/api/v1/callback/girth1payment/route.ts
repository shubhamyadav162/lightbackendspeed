import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Girth1PaymentAdapter } from '../../../../../lib/gateways/girth1payment-adapter';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Girth1Payment webhook received');
    
    // Parse the callback data
    const callbackData = await request.json();
    console.log('📋 Callback data:', callbackData);

    // Extract order ID from user_data
    const orderId = callbackData.user_data;
    
    if (!orderId) {
      console.error('❌ Missing order ID in callback');
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Find the transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (transactionError || !transaction) {
      console.error('❌ Transaction not found:', orderId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get gateway credentials
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('*')
      .eq('id', transaction.gateway_id)
      .single();

    if (gatewayError || !gateway) {
      console.error('❌ Gateway not found:', transaction.gateway_id);
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    // Create adapter and verify payment
    const adapter = new Girth1PaymentAdapter(gateway.credentials);
    const verificationResult = await adapter.verifyPayment(callbackData);

    console.log('🔍 Payment verification result:', verificationResult);

    // Update transaction status
    const updateData = {
      status: verificationResult.success ? 'completed' : 'failed',
      gateway_transaction_id: verificationResult.gateway_transaction_id,
      gateway_response: verificationResult.gateway_response,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // If payment was successful, record commission
    if (verificationResult.success) {
      const commissionAmount = transaction.amount * 0.02; // 2% commission
      
      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          transaction_id: transaction.id,
          client_id: transaction.client_id,
          amount: commissionAmount,
          commission_rate: 0.02,
          status: 'earned',
          created_at: new Date().toISOString()
        });

      if (commissionError) {
        console.error('⚠️ Failed to record commission:', commissionError);
        // Don't fail the webhook for commission errors
      }
    }

    // Forward webhook to client's callback URL if configured
    if (transaction.webhook_url) {
      try {
        const clientWebhookPayload = {
          order_id: orderId,
          transaction_id: transaction.id,
          gateway_transaction_id: verificationResult.gateway_transaction_id,
          amount: transaction.amount,
          status: verificationResult.success ? 'completed' : 'failed',
          gateway: 'LightSpeed Payment Gateway',
          timestamp: new Date().toISOString(),
          metadata: transaction.metadata
        };

        const clientResponse = await fetch(transaction.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LightSpeedPay-Webhook/1.0'
          },
          body: JSON.stringify(clientWebhookPayload)
        });

        console.log(`📤 Client webhook sent: ${clientResponse.status}`);
      } catch (webhookError) {
        console.error('⚠️ Client webhook failed:', webhookError);
        // Don't fail the main webhook for client notification errors
      }
    }

    console.log('✅ Girth1Payment webhook processed successfully');
    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('❌ Girth1Payment webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Girth1Payment GET callback received');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const callbackData = Object.fromEntries(searchParams.entries());
    
    console.log('📋 Callback data:', callbackData);

    // Extract order ID from user_data
    const orderId = callbackData.user_data;
    
    if (!orderId) {
      console.error('❌ Missing order ID in callback');
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Find the transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (transactionError || !transaction) {
      console.error('❌ Transaction not found:', orderId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get gateway credentials
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('*')
      .eq('id', transaction.gateway_id)
      .single();

    if (gatewayError || !gateway) {
      console.error('❌ Gateway not found:', transaction.gateway_id);
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    // Create adapter and verify payment
    const adapter = new Girth1PaymentAdapter(gateway.credentials);
    const verificationResult = await adapter.verifyPayment(callbackData);

    console.log('🔍 Payment verification result:', verificationResult);

    // Update transaction status
    const updateData = {
      status: verificationResult.success ? 'completed' : 'failed',
      gateway_transaction_id: verificationResult.gateway_transaction_id,
      gateway_response: verificationResult.gateway_response,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // If payment was successful, record commission
    if (verificationResult.success) {
      const commissionAmount = transaction.amount * 0.02; // 2% commission
      
      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          transaction_id: transaction.id,
          client_id: transaction.client_id,
          amount: commissionAmount,
          commission_rate: 0.02,
          status: 'earned',
          created_at: new Date().toISOString()
        });

      if (commissionError) {
        console.error('⚠️ Failed to record commission:', commissionError);
        // Don't fail the webhook for commission errors
      }
    }

    // Forward webhook to client's callback URL if configured
    if (transaction.webhook_url) {
      try {
        const clientWebhookPayload = {
          order_id: orderId,
          transaction_id: transaction.id,
          gateway_transaction_id: verificationResult.gateway_transaction_id,
          amount: transaction.amount,
          status: verificationResult.success ? 'completed' : 'failed',
          gateway: 'LightSpeed Payment Gateway',
          timestamp: new Date().toISOString(),
          metadata: transaction.metadata
        };

        const clientResponse = await fetch(transaction.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LightSpeedPay-Webhook/1.0'
          },
          body: JSON.stringify(clientWebhookPayload)
        });

        console.log(`📤 Client webhook sent: ${clientResponse.status}`);
      } catch (webhookError) {
        console.error('⚠️ Client webhook failed:', webhookError);
        // Don't fail the main webhook for client notification errors
      }
    }

    console.log('✅ Girth1Payment GET callback processed successfully');
    
    // For GET callbacks, redirect to success/failure page
    const redirectUrl = verificationResult.success 
      ? 'https://web-production-0b337.up.railway.app/success'
      : 'https://web-production-0b337.up.railway.app/failed';
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Girth1Payment GET callback error:', error);
    return NextResponse.redirect('https://web-production-0b337.up.railway.app/failed');
  }
} 