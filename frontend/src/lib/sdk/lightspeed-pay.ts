/**
 * LightSpeedPay JavaScript/TypeScript SDK
 * A client library for integrating with LightSpeedPay payment gateway wrapper
 */

// Type definitions
export interface PaymentRequest {
  amount: number;
  currency?: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  txnId: string;
  checkoutUrl: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  message?: string;
}

export interface TransactionStatus {
  txnId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  pgTxnId?: string;
  pgResponse?: any;
  failureReason?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * LightSpeedPay SDK for JavaScript/TypeScript applications
 */
export class LightSpeedPaySDK {
  private apiKey: string;
  private apiBaseUrl: string;
  private sandboxMode: boolean;

  /**
   * Initialize the SDK
   * @param apiKey Your merchant API key from LightSpeedPay dashboard
   * @param sandboxMode Whether to use sandbox mode (default: false)
   * @param customBaseUrl Optional custom API base URL
   */
  constructor(apiKey: string, sandboxMode = false, customBaseUrl?: string) {
    this.apiKey = apiKey;
    this.sandboxMode = sandboxMode;
    this.apiBaseUrl = customBaseUrl || 
      (sandboxMode ? 'https://sandbox-api.lightspeedpay.com' : 'https://api.lightspeedpay.com');
  }

  /**
   * Generate HMAC signature for authentication
   * @param timestamp Current timestamp
   * @returns HMAC signature
   */
  private generateSignature(timestamp: number): string {
    // In a real implementation, this would use crypto library to generate HMAC
    // For example: crypto.createHmac('sha256', this.apiKey).update(timestamp.toString()).digest('hex')
    return `mock-signature-${timestamp}-${this.apiKey}`;
  }

  /**
   * Initialize a payment request
   * @param paymentData Payment request data
   * @returns Promise with payment response
   */
  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': this.apiKey,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature
        },
        body: JSON.stringify({
          ...paymentData,
          is_sandbox: this.sandboxMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate payment');
      }

      return await response.json();
    } catch (error) {
      console.error('LightSpeedPay payment initiation failed:', error);
      throw error;
    }
  }

  /**
   * Check the status of a transaction
   * @param txnId Transaction ID to check
   * @returns Promise with transaction status
   */
  async checkTransactionStatus(txnId: string): Promise<TransactionStatus> {
    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/transaction/${txnId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': this.apiKey,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get transaction status');
      }

      return await response.json();
    } catch (error) {
      console.error('LightSpeedPay transaction status check failed:', error);
      throw error;
    }
  }

  /**
   * Open the checkout page in a new window/tab
   * @param checkoutUrl The checkout URL received from initiatePayment
   * @returns Window reference to the opened checkout page
   */
  openCheckout(checkoutUrl: string): Window | null {
    return window.open(checkoutUrl, 'lightspeedpay_checkout', 
      'width=450,height=700,resizable=yes,scrollbars=yes,status=yes');
  }

  /**
   * Set sandbox mode (useful for changing mode after initialization)
   * @param enabled Whether to enable sandbox mode
   */
  setSandboxMode(enabled: boolean): void {
    this.sandboxMode = enabled;
    this.apiBaseUrl = enabled 
      ? 'https://sandbox-api.lightspeedpay.com' 
      : 'https://api.lightspeedpay.com';
  }
}

// CommonJS export compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightSpeedPaySDK };
}

// Default export
export default LightSpeedPaySDK; 