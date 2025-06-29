/**
 * LightSpeed Payment Gateway Wrapper
 * 
 * This module ensures all responses to clients are branded as "LightSpeed"
 * and hide the underlying gateway providers (Razorpay, PayU, etc.)
 */

export interface LightSpeedPaymentResponse {
  success: boolean;
  transaction_id: string;        // Always LSP_xxxxx format
  checkout_url?: string;         // Always LightSpeed branded URL
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount?: number;
  currency?: string;
  message?: string;
  gateway: 'LightSpeed Payment Gateway';  // Always this brand
}

export interface LightSpeedWebhookResponse {
  success: boolean;
  transaction_id: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount?: number;
  gateway: 'LightSpeed Payment Gateway';
  processed_at: string;
}

export class LightSpeedWrapper {
  private static readonly BRAND_NAME = 'LightSpeed Payment Gateway';
  private static readonly CHECKOUT_BASE_URL = process.env.LIGHTSPEED_CHECKOUT_URL || 'https://pay.lightspeedpay.com';

  /**
   * Generate LightSpeed branded transaction ID
   */
  static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LSP_${timestamp}_${random}`;
  }

  /**
   * Convert any gateway transaction ID to LightSpeed format
   */
  static convertToLightSpeedId(gatewayTxnId: string): string {
    // If already LSP format, return as is
    if (gatewayTxnId.startsWith('LSP_')) {
      return gatewayTxnId;
    }
    
    // Convert any gateway ID to LSP format
    const timestamp = Date.now();
    const hash = gatewayTxnId.substring(gatewayTxnId.length - 6);
    return `LSP_${timestamp}_${hash}`;
  }

  /**
   * Generate LightSpeed branded checkout URL
   */
  static generateCheckoutUrl(transactionId: string, clientId?: string): string {
    const lspTxnId = this.convertToLightSpeedId(transactionId);
    return `${this.CHECKOUT_BASE_URL}/checkout/${lspTxnId}`;
  }

  /**
   * Sanitize payment response to LightSpeed branding
   */
  static sanitizePaymentResponse(
    originalResponse: any, 
    transactionId: string,
    amount?: number,
    currency?: string
  ): LightSpeedPaymentResponse {
    const lspTxnId = this.convertToLightSpeedId(transactionId);
    
    // Determine status from various gateway formats
    let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
    
    if (originalResponse.success === false) {
      status = 'failed';
    }

    // Override status if explicitly provided
    if (originalResponse.status) {
      switch (originalResponse.status.toLowerCase()) {
        case 'success':
        case 'captured':
        case 'paid':
          status = 'success';
          break;
        case 'failed':
        case 'failure':
        case 'declined':
          status = 'failed';
          break;
        case 'cancelled':
        case 'canceled':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }
    }

    return {
      success: originalResponse.success,
      transaction_id: lspTxnId,
      checkout_url: originalResponse.checkout_url ? this.generateCheckoutUrl(lspTxnId) : undefined,
      status,
      amount,
      currency: currency || 'INR',
      message: this.sanitizeMessage(originalResponse.error || originalResponse.message),
      gateway: this.BRAND_NAME
    };
  }

  /**
   * Sanitize webhook response to LightSpeed branding
   */
  static sanitizeWebhookResponse(
    originalResponse: any,
    transactionId: string,
    amount?: number
  ): LightSpeedWebhookResponse {
    const lspTxnId = this.convertToLightSpeedId(transactionId);
    
    let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
    
    if (originalResponse.status) {
      switch (originalResponse.status.toLowerCase()) {
        case 'success':
        case 'captured':
        case 'paid':
          status = 'success';
          break;
        case 'failed':
        case 'failure':
        case 'declined':
          status = 'failed';
          break;
        case 'cancelled':
        case 'canceled':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }
    }

    return {
      success: originalResponse.success,
      transaction_id: lspTxnId,
      status,
      amount,
      gateway: this.BRAND_NAME,
      processed_at: new Date().toISOString()
    };
  }

  /**
   * Sanitize error messages to remove gateway-specific information
   */
  static sanitizeMessage(originalMessage?: string): string {
    if (!originalMessage) return 'Transaction processed by LightSpeed Payment Gateway';

    // Remove gateway-specific terms
    let sanitized = originalMessage
      .replace(/razorpay/gi, 'LightSpeed')
      .replace(/payu/gi, 'LightSpeed')
      .replace(/cashfree/gi, 'LightSpeed')
      .replace(/phonepe/gi, 'LightSpeed')
      .replace(/paytm/gi, 'LightSpeed')
      .replace(/gateway api/gi, 'LightSpeed API')
      .replace(/payment gateway/gi, 'LightSpeed Payment Gateway');

    // Generic error messages
    if (sanitized.toLowerCase().includes('failed') || sanitized.toLowerCase().includes('error')) {
      return 'Payment processing failed. Please try again or contact LightSpeed support.';
    }

    if (sanitized.toLowerCase().includes('timeout')) {
      return 'Payment processing timeout. Please check status or contact LightSpeed support.';
    }

    return `LightSpeed Payment Gateway: ${sanitized}`;
  }

  /**
   * Sanitize gateway response data to remove provider-specific information
   */
  static sanitizeGatewayResponse(originalResponse: any): any {
    if (!originalResponse) return {};

    // Create a clean response object
    const sanitized: any = {
      processed_by: this.BRAND_NAME,
      timestamp: new Date().toISOString()
    };

    // Copy safe fields only
    if (originalResponse.amount) sanitized.amount = originalResponse.amount;
    if (originalResponse.currency) sanitized.currency = originalResponse.currency;
    if (originalResponse.status) sanitized.status = originalResponse.status;
    if (originalResponse.created_at) sanitized.created_at = originalResponse.created_at;

    // Remove sensitive/provider-specific fields
    const fieldsToRemove = [
      'api_key', 'key_id', 'merchant_key', 'salt', 'secret',
      'razorpay', 'payu', 'cashfree', 'phonepe', 'paytm',
      'provider', 'gateway_id', 'pg_id'
    ];

    // Filter out any field that contains provider-specific information
    Object.keys(originalResponse).forEach(key => {
      const shouldRemove = fieldsToRemove.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (!shouldRemove && !sanitized[key]) {
        sanitized[key] = originalResponse[key];
      }
    });

    return sanitized;
  }
} 