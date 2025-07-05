import crypto from 'crypto';
import { BaseAdapter } from './base-adapter';
import { PaymentInitiationResponse, PaymentVerificationResponse, PaymentCredentials } from '../../types/supabase';

export interface Girth1PaymentCredentials extends PaymentCredentials {
  partner_id: string;
  project_id: string;
  api_secret: string;
}

export class Girth1PaymentAdapter extends BaseAdapter {
  private credentials: Girth1PaymentCredentials;
  private apiUrl = 'https://api.1payment.com/init_payment';

  constructor(credentials: Girth1PaymentCredentials) {
    super();
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

  /**
   * Initiate payment with 1Payment API
   */
  async initiatePayment(
    amount: number,
    currency: string,
    orderId: string,
    customerInfo: any,
    metadata?: Record<string, any>
  ): Promise<PaymentInitiationResponse> {
    try {
      // Prepare payment parameters
      const paymentParams = {
        partner_id: this.credentials.partner_id,
        project_id: this.credentials.project_id,
        payment_type: metadata?.payment_type || 'card',
        amount: amount.toString(),
        currency: currency || 'INR',
        description: metadata?.description || 'LightSpeedPay Payment',
        user_data: orderId,
        return_url: metadata?.return_url || 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/return',
        success_url: metadata?.success_url || 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/success',
        fail_url: metadata?.fail_url || 'https://api.lightspeedpay.in/api/v1/callback/girth1payment/fail'
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
          payment_id: orderId,
          payment_url: data.payment_url || data.redirect_url,
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

  /**
   * Verify payment callback from 1Payment
   */
  async verifyPayment(callbackData: Record<string, any>): Promise<PaymentVerificationResponse> {
    try {
      // Extract payment details from callback
      const {
        user_data: orderId,
        amount,
        status,
        transaction_id,
        sign: receivedHash,
        ...otherParams
      } = callbackData;

      // Verify hash if provided
      if (receivedHash) {
        const expectedHash = this.generateHash(otherParams);
        if (receivedHash !== expectedHash) {
          return {
            success: false,
            error: 'Hash verification failed',
            gateway_response: callbackData
          };
        }
      }

      // Determine payment status
      const isSuccess = status === 'success' || status === 'completed' || status === '1';
      
      return {
        success: isSuccess,
        payment_id: orderId,
        gateway_transaction_id: transaction_id,
        amount: parseFloat(amount || '0'),
        status: isSuccess ? 'completed' : 'failed',
        gateway_response: callbackData
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed',
        gateway_response: callbackData
      };
    }
  }

  /**
   * Check payment status (if supported by 1Payment)
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentVerificationResponse> {
    // Note: 1Payment status check API endpoint would be needed
    // This is a placeholder implementation
    return {
      success: false,
      error: 'Status check not implemented for 1Payment API',
      gateway_response: null
    };
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