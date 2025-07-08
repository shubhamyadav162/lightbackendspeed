import { NextRequest, NextResponse } from 'next/server';
import { simpleError, simpleResponse } from '@/lib/simple-auth';
import { getAuthContext, getSupabaseService } from '@/lib/supabase/server';
import { EasebuzzAdapter } from '@/lib/gateways/easebuzz-adapter';

const supabaseService = getSupabaseService();

// Helper function to verify merchant authentication
async function verifyMerchantAuth(request: NextRequest) {
    // 1. Prefer Supabase Auth
    const authCtx = await getAuthContext(request);
    if (authCtx?.role === 'merchant' && authCtx.merchantId) {
        // Fetch merchant by ID
        const { data, error } = await supabaseService
            .from('merchants')
            .select('*')
            .eq('id', authCtx.merchantId)
            .single();

        if (error || !data) {
            throw new Error('Merchant account inactive or not found');
        }

        return data;
    }

    const apiKey = request.headers.get('x-api-key');
    const apiSecret = request.headers.get('x-api-secret');

    if (!apiKey) {
        throw new Error('API key is required');
    }

    // Query merchants table for the API key
    const { data, error } = await supabaseService
        .from('merchants')
        .select('*')
        .eq('api_key', apiKey)
        .single();

    if (error || !data) {
        throw new Error('Invalid API credentials');
    }

    // Verify API secret only if provided (temporary for testing)
    if (apiSecret && data.api_salt !== apiSecret) {
        throw new Error('Invalid API secret');
    }

    return data;
}

// Helper function to get active gateway
async function getActiveGateway() {
    const { data, error } = await supabaseService
        .from('payment_gateways')
        .select<string, { id: string; provider: string; credentials: { api_key: string; api_secret: string } }>('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        throw new Error('No active gateway found');
    }

    return data;
}

// Helper function to create a transaction
async function createTransaction(params: {
    merchantId: string;
    pgId: string;
    amount: number;
    customerEmail: string;
    customerPhone: string;
    isSandbox: boolean;
    transactionId: string;
}) {
    const { merchantId, pgId, amount, customerEmail, customerPhone, isSandbox, transactionId } = params;

    // Create the transaction record
    const { data, error } = await supabaseService
        .from('transactions')
        .insert({
            txn_id: transactionId,
            merchant_id: merchantId,
            pg_id: pgId,
            amount,
            currency: 'INR',
            customer_email: customerEmail,
            customer_phone: customerPhone,
            status: 'PENDING',
            is_sandbox: isSandbox,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
}

export async function POST(request: NextRequest) {
    try {
        console.log('💰 [PAY] === PAYMENT REQUEST START ===');

        // Authenticate merchant
        const merchant = await verifyMerchantAuth(request);
        if (!merchant) {
            return simpleError('Invalid API credentials', 401);
        }
        console.log('✅ [PAY] Client authenticated:', merchant.name, 'ID:', merchant.id);

        // Get request body
        const body = await request.json();
        const { amount, customer_email, customer_phone, customer_name, product_info } = body;
        console.log('📋 [PAY] Request body:', JSON.stringify(body, null, 2));

        // Validate required fields
        if (!amount || !customer_email) {
            return simpleError('Amount and customer_email are required', 400);
        }

        // Get active gateway
        const gateway = await getActiveGateway();
        if (!gateway.credentials) {
            return simpleError('Selected gateway has no credentials configured', 500);
        }

        // Generate transaction ID
        const transactionId = `LSP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        console.log('🆔 [PAY] Generated transaction ID:', transactionId);

        // Create transaction record
        const transaction = await createTransaction({
            merchantId: merchant.id,
            pgId: gateway.id,
            amount,
            customerEmail: customer_email,
            customerPhone: customer_phone || '',
            isSandbox: merchant.environment === 'test',
            transactionId: transactionId
        });
        console.log('✅ [PAY] Transaction created successfully', transaction.id);

        // Process with gateway
        if (gateway.provider === 'easebuzz') {
            const easebuzzAdapter = new EasebuzzAdapter({
                api_key: gateway.credentials.api_key,
                api_secret: gateway.credentials.api_secret
            }, merchant.environment === 'test');

            const paymentResponse = await easebuzzAdapter.initiatePayment({
                amount: amount,
                currency: 'INR',
                order_id: transaction.txn_id,
                description: product_info || 'Payment',
                customer_info: {
                    name: customer_name || 'Customer',
                    email: customer_email,
                    phone: customer_phone || '9999999999'
                },
                return_url: 'https://your-return-url.com/success' // Placeholder
            });

            if (paymentResponse.success) {
                return simpleResponse({
                    payment_url: paymentResponse.checkout_url,
                    transaction_id: transaction.txn_id,
                });
            } else {
                return simpleError(paymentResponse.error || 'Failed to initiate payment', 500);
            }
        } else {
            return simpleError(`Gateway provider ${gateway.provider} not supported`, 501);
        }

    } catch (err: any) {
        console.error('❌ [PAY] Error:', err);
        return simpleError(err.message, 500);
    }
} 