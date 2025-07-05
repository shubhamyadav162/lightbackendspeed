import { NextRequest, NextResponse } from 'next/server';
import { NGMGateway } from '@/lib/gateways/ngm';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

const ngmGateway = new NGMGateway({
  merchantId: process.env.NGM_MERCHANT_ID || '',
  clientKey: process.env.NGM_CLIENT_KEY || '',
  clientSalt: process.env.NGM_CLIENT_SALT || '',
  baseUrl: process.env.NGM_BASE_URL || '',
  webhookUrl: process.env.NGM_WEBHOOK_URL || ''
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (action === 'initiate') {
      // Payment initiation
      const paymentResponse = await ngmGateway.initiatePayment({
        amount: params.amount,
        orderId: params.orderId,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        returnUrl: params.returnUrl,
        webhookUrl: params.webhookUrl
      });

      return NextResponse.json({
        success: true,
        data: paymentResponse
      });
    }

    if (action === 'webhook') {
      // Webhook handling
      const webhookResponse = await ngmGateway.handleWebhook(params);

      return NextResponse.json({
        success: true,
        data: webhookResponse
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('NGM API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 