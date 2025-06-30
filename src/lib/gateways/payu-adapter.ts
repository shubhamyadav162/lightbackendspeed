import { BaseGatewayAdapter, PaymentRequest, PaymentResponse, PaymentStatusResponse, WebhookResponse } from './base-adapter';
import { LightSpeedWrapper } from '../lightspeed-wrapper';
import crypto from 'crypto';

interface PayUCredentials {
  merchant_key: string;
  salt: string;
  auth_header?: string;
}

export class PayUAdapter extends BaseGatewayAdapter {
  protected credentials: PayUCredentials;

  constructor(credentials: PayUCredentials, isTestMode = false) {
    super(credentials, isTestMode);
    this.credentials = credentials;
  }

  protected getTestBaseUrl(): string {
    return 'https://test.payu.in/_payment';
  }

  protected getProdBaseUrl(): string {
    return 'https://secure.payu.in/_payment';
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate LightSpeed transaction ID
      const lightspeedTxnId = LightSpeedWrapper.generateTransactionId();
      
      // PayU expects amount in rupees (not paisa)
      const amount = (request.amount / 100).toFixed(2);
      
      // Create hash for PayU using LightSpeed transaction ID
      const hashString = `${this.credentials.merchant_key}|${lightspeedTxnId}|${amount}|${request.description || 'Payment'}|${request.customer_info.name}|${request.customer_info.email}|||||||||||${this.credentials.salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const paymentData = {
        key: this.credentials.merchant_key,
        txnid: lightspeedTxnId, // Use LightSpeed ID for PayU as well
        amount: amount,
        productinfo: request.description || 'Payment',
        firstname: request.customer_info.name || 'Customer',
        email: request.customer_info.email || '',
        phone: request.customer_info.phone || '',
        surl: request.return_url + '?status=success',
        furl: request.return_url + '?status=failure',
        hash: hash,
        service_provider: 'payu_paisa'
      };

      // Generate LightSpeed branded checkout URL instead of PayU URL
      const checkoutUrl = LightSpeedWrapper.generateCheckoutUrl(lightspeedTxnId);

      // Return sanitized LightSpeed response
      return LightSpeedWrapper.sanitizePaymentResponse({
        success: true,
        payment_id: lightspeedTxnId,
        checkout_url: checkoutUrl,
        gateway_response: paymentData
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
      // PayU status check API
      const command = 'verify_payment';
      const hashString = `${this.credentials.merchant_key}|${command}|${paymentId}|${this.credentials.salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const requestData = {
        key: this.credentials.merchant_key,
        command: command,
        hash: hash,
        var1: paymentId
      };

      const response = await fetch('https://info.payu.in/merchant/postservice.php?form=2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData).toString()
      });

      const result = await response.json();

      if (!response.ok || result.status === 0) {
        return {
          success: false,
          status: 'FAILED',
          error: LightSpeedWrapper.sanitizeMessage(result.msg || 'Status check failed')
        };
      }

      const transactionDetails = result.transaction_details?.[paymentId];
      if (!transactionDetails) {
        return {
          success: true,
          status: 'PENDING',
          payment_id: paymentId
        };
      }

      let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      switch (transactionDetails.status) {
        case 'success':
          status = 'SUCCESS';
          break;
        case 'failure':
          status = 'FAILED';
          break;
        case 'pending':
          status = 'PENDING';
          break;
        default:
          status = 'CANCELLED';
      }

      return {
        success: true,
        status,
        payment_id: paymentId,
        transaction_id: transactionDetails.mihpayid,
        amount: parseFloat(transactionDetails.amount) * 100, // Convert back to paisa
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
      // PayU webhook verification
      const { 
        status, 
        txnid, 
        amount, 
        mihpayid,
        key,
        hash: receivedHash 
      } = payload;

      // Verify hash
      const hashString = `${this.credentials.salt}|${status}|||||||||||${payload.email}|${payload.firstname}|${payload.productinfo}|${amount}|${txnid}|${key}`;
      const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

      if (receivedHash !== expectedHash) {
        return {
          success: false,
          status: 'FAILED',
          error: 'Authentication failed'
        };
      }

      let paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      switch (status) {
        case 'success':
          paymentStatus = 'SUCCESS';
          break;
        case 'failure':
          paymentStatus = 'FAILED';
          break;
        case 'pending':
          paymentStatus = 'PENDING';
          break;
        default:
          paymentStatus = 'CANCELLED';
      }

      // Return sanitized webhook response with proper typing
      const sanitizedResponse = LightSpeedWrapper.sanitizeWebhookResponse({
        success: true,
        transaction_id: mihpayid,
        status: paymentStatus,
        amount: parseFloat(amount) * 100, // Convert to paisa
        gateway_response: payload
      }, txnid, parseFloat(amount) * 100);

      return {
        success: sanitizedResponse.success,
        transaction_id: sanitizedResponse.transaction_id,
        status: paymentStatus, // Use the already converted status from above
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
      // Test PayU credentials by making a test verification call
      const command = 'get_merchant_ibibo_codes';
      const hashString = `${this.credentials.merchant_key}|${command}|default|${this.credentials.salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const requestData = {
        key: this.credentials.merchant_key,
        command: command,
        hash: hash,
        var1: 'default'
      };

      const response = await fetch('https://info.payu.in/merchant/postservice.php?form=2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData).toString()
      });

      const result = await response.json();
      return response.ok && result.status !== 0;
    } catch {
      return false;
    }
  }
} 