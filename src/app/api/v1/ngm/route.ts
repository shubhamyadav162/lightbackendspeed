import { NextRequest, NextResponse } from 'next/server';
import { NGMGateway } from '@/lib/gateways/ngm';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

const ngmGateway = new NGMGateway({
  merchantId: process.env.NGM_MERCHANT_ID || 'DEFAULT_MERCHANT',
  clientKey: process.env.NGM_CLIENT_KEY || 'DEFAULT_KEY',
  clientSalt: process.env.NGM_CLIENT_SALT || 'DEFAULT_SALT',
  baseUrl: process.env.NGM_BASE_URL || 'https://example.com',
  webhookUrl: process.env.NGM_WEBHOOK_URL || 'https://web-production-0b337.up.railway.app/api/v1/ngm'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    console.log('NGM API Request:', { action, params });

    if (action === 'initiate') {
      try {
        // Payment initiation
        const paymentResponse = await ngmGateway.initiatePayment({
          amount: params.amount || 10,
          orderId: params.orderId || `NGM_${Date.now()}`,
          customerEmail: params.customerEmail || 'test@example.com',
          customerName: params.customerName || 'Test User',
          returnUrl: params.returnUrl || 'https://web-production-0b337.up.railway.app/success',
          webhookUrl: params.webhookUrl || 'https://web-production-0b337.up.railway.app/api/v1/ngm'
        });

        console.log('NGM Payment Response:', paymentResponse);

        return NextResponse.json({
          success: true,
          data: paymentResponse,
          message: 'Payment initiated via NGM → EaseBuzz'
        });
      } catch (paymentError: any) {
        console.error('NGM Payment Error:', paymentError);
        return NextResponse.json({
          success: false,
          error: paymentError.message || 'Payment initiation failed',
          details: 'Check NGM credentials and EaseBuzz connectivity'
        }, { status: 500 });
      }
    }

    if (action === 'webhook') {
      try {
        // Webhook handling
        const webhookResponse = await ngmGateway.handleWebhook(params);

        console.log('NGM Webhook Response:', webhookResponse);

        return NextResponse.json({
          success: true,
          data: webhookResponse,
          message: 'Webhook processed successfully'
        });
      } catch (webhookError: any) {
        console.error('NGM Webhook Error:', webhookError);
        return NextResponse.json({
          success: false,
          error: webhookError.message || 'Webhook processing failed'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "initiate" or "webhook"',
      available_actions: ['initiate', 'webhook']
    }, { status: 400 });

  } catch (error: any) {
    console.error('NGM API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      help: 'Check request format and try again'
    }, { status: 500 });
  }
} 