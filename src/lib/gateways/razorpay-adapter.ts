import { BaseGatewayAdapter, PaymentRequest, PaymentResponse, PaymentStatusResponse, WebhookResponse } from './base-adapter';
import { LightSpeedWrapper } from '../lightspeed-wrapper';
import crypto from 'crypto';

interface RazorpayCredentials {
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
}

export class RazorpayAdapter extends BaseGatewayAdapter {
  protected credentials: RazorpayCredentials;

  constructor(credentials: RazorpayCredentials, isTestMode = false) {
    super(credentials, isTestMode);
    this.credentials = credentials;
  }

  protected getTestBaseUrl(): string {
    return 'https://api.razorpay.com/v1';
  }

  protected getProdBaseUrl(): string {
    return 'https://api.razorpay.com/v1';
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const auth = Buffer.from(`${this.credentials.api_key}:${this.credentials.api_secret}`).toString('base64');
      
      // Generate LightSpeed transaction ID for this payment
      const lightspeedTxnId = LightSpeedWrapper.generateTransactionId();
      
      // Create Razorpay order
      const orderData = {
        amount: request.amount, // Razorpay expects amount in paisa
        currency: request.currency,
        receipt: lightspeedTxnId, // Use LightSpeed ID as receipt
        notes: {
          lightspeed_txn_id: lightspeedTxnId,
          customer_name: request.customer_info.name,
          customer_email: request.customer_info.email,
          customer_phone: request.customer_info.phone,
        }
      };

      const response = await fetch(`${this.getBaseUrl()}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Return LightSpeed branded error response
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          error: result.error?.description || 'Order creation failed',
          gateway_response: result
        }, lightspeedTxnId, request.amount, request.currency);
      }

      // Generate LightSpeed branded checkout URL instead of Razorpay URL
      const checkoutUrl = LightSpeedWrapper.generateCheckoutUrl(lightspeedTxnId);

      // Return sanitized LightSpeed response
      return LightSpeedWrapper.sanitizePaymentResponse({
        success: true,
        payment_id: result.id,
        checkout_url: checkoutUrl,
        gateway_response: result
      }, lightspeedTxnId, request.amount, request.currency);

    } catch (error) {
      const errorTxnId = LightSpeedWrapper.generateTransactionId();
      return LightSpeedWrapper.sanitizePaymentResponse({
        success: false,
        error: `Network error occurred`,
      }, errorTxnId, request.amount, request.currency);
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const auth = Buffer.from(`${this.credentials.api_key}:${this.credentials.api_secret}`).toString('base64');
      
      const response = await fetch(`${this.getBaseUrl()}/orders/${paymentId}/payments`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: LightSpeedWrapper.sanitizeMessage(result.error?.description || 'Status check failed')
        };
      }

      // Get the latest payment for this order
      const payment = result.items?.[0];
      if (!payment) {
        return {
          success: true,
          status: 'PENDING',
          payment_id: paymentId
        };
      }

      let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      switch (payment.status) {
        case 'captured':
          status = 'SUCCESS';
          break;
        case 'failed':
          status = 'FAILED';
          break;
        case 'cancelled':
          status = 'CANCELLED';
          break;
        default:
          status = 'PENDING';
      }

      return {
        success: true,
        status,
        payment_id: paymentId,
        transaction_id: payment.id,
        amount: payment.amount,
        gateway_response: LightSpeedWrapper.sanitizeGatewayResponse(result)
      };

    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: LightSpeedWrapper.sanitizeMessage('Status verification failed')
      };
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    try {
      // Verify webhook signature if provided
      if (signature && this.credentials.webhook_secret) {
        const expectedSignature = crypto
          .createHmac('sha256', this.credentials.webhook_secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        if (signature !== expectedSignature) {
          return {
            success: false,
            status: 'FAILED',
            error: 'Authentication failed'
          };
        }
      }

      const event = payload.event;
      const paymentData = payload.payload?.payment?.entity;

      if (!paymentData) {
        return {
          success: false,
          status: 'FAILED',
          error: 'Invalid request format'
        };
      }

      let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      switch (event) {
        case 'payment.captured':
          status = 'SUCCESS';
          break;
        case 'payment.failed':
          status = 'FAILED';
          break;
        case 'payment.cancelled':
          status = 'CANCELLED';
          break;
        default:
          status = 'PENDING';
      }

      // Return sanitized webhook response with proper typing
      const sanitizedResponse = LightSpeedWrapper.sanitizeWebhookResponse({
        success: true,
        transaction_id: paymentData.id,
        status,
        amount: paymentData.amount,
        gateway_response: payload
      }, paymentData.id, paymentData.amount);

      return {
        success: sanitizedResponse.success,
        transaction_id: sanitizedResponse.transaction_id,
        status: status, // Use the already converted status from above
        amount: sanitizedResponse.amount,
        gateway_response: LightSpeedWrapper.sanitizeGatewayResponse(payload)
      };

    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: LightSpeedWrapper.sanitizeMessage('Request processing failed')
      };
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.credentials.api_key}:${this.credentials.api_secret}`).toString('base64');
      
      const response = await fetch(`${this.getBaseUrl()}/orders?count=1`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }
} 