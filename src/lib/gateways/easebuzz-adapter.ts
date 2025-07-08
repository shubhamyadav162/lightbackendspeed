import { BaseGatewayAdapter, GatewayCredentials, PaymentRequest, PaymentResponse, PaymentStatusResponse, WebhookResponse } from './base-adapter';
import { LightSpeedWrapper } from '../lightspeed-wrapper';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';

interface EasebuzzCredentials {
  api_key: string;      // Merchant Key
  api_secret: string;   // Salt
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
      const amount = (request.amount / 100).toFixed(2); // Convert paisa to rupees with exactly 2 decimals

      // Generate hash for Easebuzz (SHA-512)
      // Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
      const hashString = [
        this.credentials.api_key,
        txnid,
        amount,
        request.description || 'Payment',
        request.customer_info?.name || 'Customer',
        request.customer_info?.email || '',
        '', '', '', '', '',  // UDF1-5
        '', '', '', '', '',  // UDF6-10
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
        surl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzz',
        furl: 'https://api.lightspeedpay.in/api/v1/callback/easebuzz',
        hash: hash,
        udf1: '',
        udf2: '',
        udf3: '',
        udf4: '',
        udf5: '',
        udf6: '',
        udf7: '',
        udf8: '',
        udf9: '',
        udf10: ''
      };

      const apiUrl = this.isTestMode 
        ? 'https://testpay.easebuzz.in/payment/initiateLink'
        : 'https://pay.easebuzz.in/payment/initiateLink';

      console.log('Easebuzz paymentData:', paymentData);
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(paymentData).toString()
      });

      const result = await response.json();

      console.log('Response status:', response.status);
      console.log('Response body:', result);

      if (result.status === 1) {
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
      // Reverse hash format: salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const hashString = [
        this.credentials.api_secret,
        status || '',
        '', '', '', '', '',  // Exactly 5 empty fields for UDF5-UDF1
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

      const sanitizedResponse = LightSpeedWrapper.sanitizeWebhookResponse({
        success: true,
        transaction_id: txnid,
        status: paymentStatus,
        amount: parseFloat(amount) * 100,
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

// उदाहरण:
const credentials = {
  api_key: 'FRQT0XKLHY',    // nextgen_techno_ventures.key
  api_secret: 'S84LOJ3U0N', // nextgen_techno_ventures.salt
  merchant_id: '682aefe4e352d264171612c0' // nextgen_techno_ventures.merchant_id
};

// उदाहरण:
const easebuzz = new EasebuzzAdapter(credentials, true); // true = test mode 