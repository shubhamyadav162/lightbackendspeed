import crypto from 'crypto';
import { BaseGatewayAdapter, PaymentRequest, PaymentResponse, PaymentStatusResponse, WebhookResponse, GatewayCredentials } from './base-adapter';

export interface Girth1PaymentCredentials extends GatewayCredentials {
  partner_id: string;
  project_id: string;
  api_secret: string;
}

export class Girth1PaymentAdapter extends BaseGatewayAdapter {
  protected credentials: Girth1PaymentCredentials;
  private apiUrl = 'https://api.1payment.com/init_payment';

  constructor(credentials: Girth1PaymentCredentials) {
    super(credentials);
    this.credentials = credentials;
  }

  /**
   * Generate MD5 hash for 1Payment API
   * Format: md5("init_payment" + params_alphabetical + api_secret)
   */
  private generateHash(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const paramsString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const hashString = `init_payment${paramsString}${this.credentials.api_secret}`;
    
    return crypto.createHash('md5').update(hashString, 'utf8').digest('hex');
  }

  protected getTestBaseUrl(): string {
    return 'https://api.1payment.com';
  }

  protected getProdBaseUrl(): string {
    return 'https://api.1payment.com';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const testResult = await this.initiatePayment({
        amount: 1,
        currency: 'INR',
        order_id: `TEST_${Date.now()}`,
        customer_info: {
          name: 'Test User',
          email: 'test@lightspeedpay.com',
          phone: '+919999999999'
        },
        description: 'Credential validation test'
      });
      return testResult.success;
    } catch (error) {
      return false;
    }
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Prepare payment parameters
      const paymentParams = {
        partner_id: this.credentials.partner_id,
        project_id: this.credentials.project_id,
        payment_type: 'card',
        amount: request.amount.toString(),
        currency: request.currency || 'INR',
        description: request.description || 'LightSpeedPay Payment',
        user_data: request.order_id,
        return_url: request.return_url || 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return',
        success_url: request.return_url || 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/success',
        fail_url: 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/fail'
      };

      // Generate hash
      const hash = this.generateHash(paymentParams);

      // Build URL with parameters
      const urlParams = new URLSearchParams({
        ...paymentParams,
        sign: hash
      });

      const finalUrl = `${this.apiUrl}?${urlParams.toString()}`;

      // Make API call
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LightSpeedPay/1.0'
        }
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`1Payment API Error: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Handle API response
      if (data.payment_url || data.redirect_url) {
        return {
          success: true,
          payment_id: request.order_id,
          checkout_url: data.payment_url || data.redirect_url,
          gateway_response: data
        };
      } else if (data.error_code) {
        return {
          success: false,
          error: `1Payment Error Code ${data.error_code}: ${data.error || data.error_description || 'Parameter validation failed'}`,
          gateway_response: data
        };
      } else {
        return {
          success: false,
          error: 'Unknown response format from 1Payment API',
          gateway_response: data
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
        gateway_response: null
      };
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return {
      success: false,
      status: 'PENDING',
      error: 'Status check not implemented for 1Payment API',
      gateway_response: null
    };
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    try {
      // Extract payment details from callback
      const {
        user_data: orderId,
        amount,
        status,
        transaction_id,
        sign: receivedHash,
        ...otherParams
      } = payload;

      // Verify hash if provided
      if (receivedHash) {
        const expectedHash = this.generateHash(otherParams);
        if (receivedHash !== expectedHash) {
          return {
            success: false,
            status: 'FAILED',
            error: 'Hash verification failed',
            gateway_response: payload
          };
        }
      }

      // Determine payment status
      const isSuccess = status === 'success' || status === 'completed' || status === '1';
      
      return {
        success: isSuccess,
        transaction_id: orderId,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        amount: parseFloat(amount || '0'),
        gateway_response: payload
      };

    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Payment verification failed',
        gateway_response: payload
      };
    }
  }

  /**
   * Get adapter name
   */
  getAdapterName(): string {
    return 'girth1payment';
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): string[] {
    return ['card', 'upi', 'netbanking', 'wallet'];
  }
} 