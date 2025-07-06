import { NextRequest, NextResponse } from 'next/server';
import { simpleAuth, simpleError, simpleResponse } from '@/lib/simple-auth';
import { getSupabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

// Simple payment processing without complex authentication
export async function POST(request: NextRequest) {
  try {
    console.log('💰 [PAY] === PAYMENT REQUEST START ===');
    
    // Simple API key authentication
    const client = await simpleAuth(request);
    if (!client) {
      return simpleError('Invalid API key', 401);
    }

    console.log('✅ [PAY] Client authenticated:', client.name, 'ID:', client.id);

    // Get request body
    const body = await request.json();
    console.log('📋 [PAY] Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.amount || !body.customer_email) {
      return simpleError('Amount and customer_email are required', 400);
    }

    // Generate transaction ID
    const transactionId = `LSP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log('🆔 [PAY] Generated transaction ID:', transactionId);

    try {
      // Get Supabase client
      const supabase = getSupabaseService();
      
      // Get an active gateway (simple selection)
      console.log('🔍 [PAY] Fetching active gateways...');
      const { data: gateways, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (gatewayError || !gateways || gateways.length === 0) {
        console.log('❌ [PAY] No active gateways found:', gatewayError);
        return simpleError('No payment gateway available', 503);
      }

      console.log('🔍 [PAY] Found', gateways.length, 'active gateways');
      gateways.forEach((gw, idx) => {
        console.log(`  ${idx + 1}. ${gw.name} (${gw.provider}) - Priority: ${gw.priority}, Has credentials: ${!!(gw.credentials && gw.credentials.api_key)}`);
      });

      // Select first active gateway with valid credentials
      let selectedGateway = null;
      for (const gateway of gateways) {
        console.log(`\n🔍 [PAY] === CHECKING GATEWAY: ${gateway.name} ===`);
        console.log(`🔍 [PAY] Provider: ${gateway.provider}`);
        console.log(`🔍 [PAY] Priority: ${gateway.priority}`);
        console.log(`🔍 [PAY] Credentials type:`, typeof gateway.credentials);
        console.log(`🔍 [PAY] Credentials:`, JSON.stringify(gateway.credentials, null, 2));
        
        if (gateway.credentials && gateway.credentials.api_key && gateway.credentials.api_secret) {
          console.log(`✅ [PAY] Gateway ${gateway.name} has valid credentials!`);
          selectedGateway = gateway;
          break;
        } else {
          console.log(`⚠️ [PAY] Gateway ${gateway.name} missing credentials - skipping`);
        }
      }

      if (!selectedGateway) {
        console.log('❌ [PAY] No gateway with valid credentials found');
        return simpleError('No payment gateway with valid credentials available', 503);
      }

      console.log(`\n🚀 [PAY] === SELECTED GATEWAY: ${selectedGateway.name} ===`);
      console.log(`🚀 [PAY] Provider: ${selectedGateway.provider}`);
      console.log(`🚀 [PAY] API Key: ${selectedGateway.credentials.api_key}`);
      console.log(`🚀 [PAY] API Secret: ${selectedGateway.credentials.api_secret ? 'SET' : 'NOT SET'}`);

      // Create transaction record
      console.log('💾 [PAY] Creating transaction record...');
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          txn_id: transactionId,
          merchant_id: client.id,
          pg_id: selectedGateway.id,
          amount: body.amount,
          currency: 'INR',
          status: 'PENDING',
          customer_email: body.customer_email,
          customer_phone: body.customer_phone || '',
          is_sandbox: client.environment === 'test'
        })
        .select()
        .single();

      if (txnError) {
        console.error('❌ [PAY] Transaction creation failed:', txnError);
        console.error('❌ [PAY] Error details:', JSON.stringify(txnError, null, 2));
        return simpleError(`Failed to create transaction: ${txnError.message}`, 500);
      }

      console.log('✅ [PAY] Transaction created successfully');

      // Process with gateway - check provider name
      console.log(`\n🔄 [PAY] === PROCESSING WITH GATEWAY ===`);
      console.log(`🔄 [PAY] Checking provider: "${selectedGateway.provider}"`);
      
      const isEasebuzzProvider = selectedGateway.provider === 'easebuzz' || 
                                selectedGateway.provider === 'easebuzz_primary' || 
                                selectedGateway.provider.toLowerCase().includes('easebuzz');
      
      console.log(`🔄 [PAY] Is Easebuzz provider:`, isEasebuzzProvider);

      if (isEasebuzzProvider) {
        console.log('✅ [PAY] Processing with Easebuzz adapter...');
        
        try {
          console.log('🔧 [PAY] Creating EasebuzzAdapter...');
          const adapter = new EasebuzzAdapter(selectedGateway.credentials, selectedGateway.credentials.environment === 'test');
          
          console.log('🔧 [PAY] Preparing payment request...');
          const paymentRequest = {
            amount: body.amount,
            currency: 'INR',
            order_id: transactionId,
            customer_info: {
              name: body.customer_name || 'Customer',
              email: body.customer_email,
              phone: body.customer_phone || ''
            },
            return_url: body.return_url || 'https://pay.lightspeedpay.com/success',
            description: body.description || 'Payment'
          };

          console.log('🔧 [PAY] Calling adapter.initiatePayment...');
          const result = await adapter.initiatePayment(paymentRequest);
          
          console.log('🔧 [PAY] Payment result:', JSON.stringify(result, null, 2));
          
          if (result.success) {
            // Update transaction with gateway response
            await supabase
              .from('transactions')
              .update({
                pg_response: result.gateway_response
              })
              .eq('txn_id', transactionId);

            console.log('✅ [PAY] Payment initiated successfully');
            
            return simpleResponse({
              success: true,
              transaction_id: transactionId,
              checkout_url: result.checkout_url,
              status: 'pending',
              amount: body.amount,
              currency: 'INR',
              gateway: selectedGateway.name
            });
          } else {
            console.error('❌ [PAY] Payment initiation failed:', result.error);
            return simpleError(result.error || 'Payment initiation failed', 400);
          }
        } catch (adapterError: any) {
          console.error('❌ [PAY] Adapter error:', adapterError);
          return simpleError('Payment adapter error: ' + (adapterError?.message || 'Unknown error'), 500);
        }
      } else {
        console.error('❌ [PAY] Unsupported gateway provider:', selectedGateway.provider);
        return simpleError(`Gateway provider '${selectedGateway.provider}' not supported yet`, 503);
      }

    } catch (error: any) {
      console.error('❌ [PAY] Payment processing error:', error);
      return simpleError('Payment processing failed: ' + (error?.message || 'Unknown error'), 500);
    }

  } catch (error: any) {
    console.error('❌ [PAY] Request processing error:', error);
    return simpleError('Invalid request: ' + (error?.message || 'Unknown error'), 400);
  }
} 