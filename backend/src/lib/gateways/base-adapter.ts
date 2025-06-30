// Base Gateway Adapter Interface
export interface GatewayCredentials {
  [key: string]: any; // Different gateways have different credential structures
}

export interface PaymentRequest {
  amount: number;           // Amount in paisa
  currency: string;         // INR
  order_id: string;         // Unique order ID
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
  };
  return_url?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;        // Gateway's payment/order ID
  checkout_url?: string;      // URL to redirect customer
  qr_code?: string;          // For UPI QR codes
  error?: string;
  gateway_response?: any;     // Raw gateway response
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  payment_id?: string;
  transaction_id?: string;
  amount?: number;
  gateway_response?: any;
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  transaction_id?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount?: number;
  gateway_response?: any;
  error?: string;
}

// Base Gateway Adapter Class
export abstract class BaseGatewayAdapter {
  protected credentials: GatewayCredentials;
  protected gatewayName: string;
  protected isTestMode: boolean;

  constructor(credentials: GatewayCredentials, isTestMode = false) {
    this.credentials = credentials;
    this.isTestMode = isTestMode;
    this.gatewayName = this.constructor.name.replace('Adapter', '').toLowerCase();
  }

  // Abstract methods that each gateway must implement
  abstract initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
  abstract processWebhook(payload: any, signature?: string): Promise<WebhookResponse>;
  abstract validateCredentials(): Promise<boolean>;

  // Common utility methods
  protected generateOrderId(prefix: string = 'LSP'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `LSP_${timestamp}_${random}`.toUpperCase();
  }

  protected validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 10000000; // Max 1 crore paisa = 10 lakh rupees
  }

  protected getBaseUrl(): string {
    // Return appropriate base URL based on test/production mode
    return this.isTestMode ? this.getTestBaseUrl() : this.getProdBaseUrl();
  }

  protected abstract getTestBaseUrl(): string;
  protected abstract getProdBaseUrl(): string;
} 