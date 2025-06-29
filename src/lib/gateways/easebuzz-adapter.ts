import { BaseGatewayAdapter, GatewayCredentials, PaymentRequest, PaymentResponse, PaymentStatusResponse, WebhookResponse } from './base-adapter';
import { LightSpeedWrapper } from '../lightspeed-wrapper';
import crypto from 'crypto';

interface EasebuzzCredentials {
  api_key: string;      // Merchant Key (D4SS5CFXKV)
  api_secret: string;   // Salt (HRQ1A10K7J)
  webhook_secret?: string;
}

export class EasebuzzAdapter extends BaseGatewayAdapter {
  constructor(credentials: GatewayCredentials, isTestMode = false) {
    super(credentials, isTestMode);
  }

  protected getTestBaseUrl(): string {
    return 'https://testpay.easebuzz.in';
  }

  protected getProdBaseUrl(): string {
    return 'https://pay.easebuzz.in';
  }

  /**
   * Initiate payment order with Easebuzz
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const txnid = LightSpeedWrapper.generateTransactionId();
      const amount = (request.amount / 100).toFixed(2); // Convert paisa to rupees

      // Generate hash for Easebuzz (SHA-512)
      // Hash format: key|txnid|amount|productinfo|firstname|email|||||||salt
      const hashString = [
        this.credentials.api_key,
        txnid,
        amount,
        request.description || 'Payment',
        request.customer_info?.name || 'Customer',
        request.customer_info?.email || '',
        '', '', '', '', '', '', '', // UDF fields (empty)
        this.credentials.api_secret
      ].join('|');

      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const paymentData = {
        key: this.credentials.api_key,
        txnid: txnid,
        amount: amount,
        productinfo: request.description || 'Payment',
        firstname: request.customer_info?.name || 'Customer',
        email: request.customer_info?.email || '',
        phone: request.customer_info?.phone || '',
        surl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp',
        furl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp',
        hash: hash
      };

      const apiUrl = this.isTestMode 
        ? 'https://testpay.easebuzz.in/payment/initiateLink'
        : 'https://pay.easebuzz.in/payment/initiateLink';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(paymentData).toString()
      });

      const result = await response.json();

      if (result.status === 1) {
        // Success response - return LightSpeed branded response
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: true,
          transaction_id: txnid,
          checkout_url: result.data,
          status: 'pending',
          gateway_response: result
        }, txnid, request.amount);
      } else {
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          status: 'failed',
          error: LightSpeedWrapper.sanitizeMessage(result.data || 'Payment initiation failed')
        }, txnid, request.amount);
      }

    } catch (error) {
      return LightSpeedWrapper.sanitizePaymentResponse({
        success: false,
        status: 'failed',
        error: LightSpeedWrapper.sanitizeMessage('Request processing failed')
      }, request.order_id, request.amount);
    }
  }

  /**
   * Check payment status with Easebuzz
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      // For Easebuzz transaction status API
      const postData: any = {
        key: this.credentials.api_key,
        txnid: paymentId,
        amount: '1.00', // Dummy amount for status check
        email: 'dummy@example.com',
        phone: '9999999999'
      };

      // Generate hash for transaction API
      const hashString = [
        this.credentials.api_key,
        postData.txnid,
        postData.email,
        this.credentials.api_secret
      ].join('|');

      const hash = crypto.createHash('sha512').update(hashString).digest('hex');
      postData.hash = hash;

      const apiUrl = this.isTestMode
        ? 'https://testdashboard.easebuzz.in/transaction/v1/retrieve'
        : 'https://dashboard.easebuzz.in/transaction/v1/retrieve';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString()
      });

      const result = await response.json();

      if (result.status === 1 && result.data) {
        const status = result.data.status?.toLowerCase();
        let paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'PENDING';

        switch (status) {
          case 'success':
          case 'captured':
            paymentStatus = 'SUCCESS';
            break;
          case 'failed':
          case 'failure':
            paymentStatus = 'FAILED';
            break;
          case 'usercancel':
            paymentStatus = 'CANCELLED';
            break;
          default:
            paymentStatus = 'PENDING';
        }

        return {
          success: true,
          status: paymentStatus,
          payment_id: paymentId,
          transaction_id: paymentId,
          amount: parseFloat(result.data.amount) * 100, // Convert to paisa
          gateway_response: LightSpeedWrapper.sanitizeGatewayResponse(result)
        };
      } else {
        return {
          success: false,
          status: 'FAILED' as const,
          error: LightSpeedWrapper.sanitizeMessage(result.msg || 'Status check failed')
        };
      }

    } catch (error) {
      return {
        success: false,
        status: 'FAILED' as const,
        error: LightSpeedWrapper.sanitizeMessage('Status verification failed')
      };
    }
  }

  /**
   * Process webhook from Easebuzz
   */
  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    try {
      // Easebuzz webhook verification
      const {
        status,
        txnid,
        amount,
        email,
        firstname,
        productinfo,
        hash: receivedHash,
        key
      } = payload;

      // Verify hash - Easebuzz uses reverse hash for webhook
      // Reverse hash format: salt|status|||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const hashString = [
        this.credentials.api_secret,
        status || '',
        '', '', '', '', '', '', '', // UDF fields (empty in reverse)
        email || '',
        firstname || '',
        productinfo || '',
        amount || '',
        txnid || '',
        key || ''
      ].join('|');

      const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

      if (receivedHash !== expectedHash) {
        return {
          success: false,
          status: 'FAILED',
          error: 'Authentication failed'
        };
      }

      let paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      switch (status?.toLowerCase()) {
        case 'success':
          paymentStatus = 'SUCCESS';
          break;
        case 'failed':
        case 'failure':
          paymentStatus = 'FAILED';
          break;
        case 'usercancel':
          paymentStatus = 'CANCELLED';
          break;
        default:
          paymentStatus = 'PENDING';
      }

      // Return sanitized webhook response with LightSpeed branding
      const sanitizedResponse = LightSpeedWrapper.sanitizeWebhookResponse({
        success: true,
        transaction_id: txnid,
        status: paymentStatus,
        amount: parseFloat(amount) * 100, // Convert to paisa
        gateway_response: payload
      }, txnid, parseFloat(amount) * 100);

      return {
        success: sanitizedResponse.success,
        transaction_id: sanitizedResponse.transaction_id,
        status: paymentStatus,
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

  /**
   * Validate Easebuzz credentials by making a test API call
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Test with a dummy transaction query to validate credentials
      const testData: any = {
        key: this.credentials.api_key,
        txnid: 'TEST_TXN_' + Date.now(),
        email: 'test@example.com'
      };

      const hashString = [
        this.credentials.api_key,
        testData.txnid,
        testData.email,
        this.credentials.api_secret
      ].join('|');

      const hash = crypto.createHash('sha512').update(hashString).digest('hex');
      testData.hash = hash;

      const apiUrl = this.isTestMode
        ? 'https://testdashboard.easebuzz.in/transaction/v1/retrieve'
        : 'https://dashboard.easebuzz.in/transaction/v1/retrieve';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(testData).toString()
      });

      const result = await response.json();
      
      // If we get a valid response format (even if transaction not found), credentials are valid
      return response.ok && (result.status === 1 || result.status === 0);
    } catch {
      return false;
    }
  }
} 