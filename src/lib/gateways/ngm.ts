export interface NGMConfig {
  merchantId: string;
  clientKey: string;
  clientSalt: string;
  baseUrl: string;
  webhookUrl: string;
}

export class NGMGateway {
  private config: NGMConfig;

  constructor(config: NGMConfig) {
    this.config = config;
  }

  async initiatePayment(params: {
    amount: number;
    orderId: string;
    customerEmail: string;
    customerName: string;
    returnUrl: string;
    webhookUrl: string;
  }) {
    // NGM को payment request भेजें
    const paymentData = {
      merchant_id: this.config.merchantId,
      amount: params.amount,
      order_id: params.orderId,
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      return_url: params.returnUrl,
      webhook_url: params.webhookUrl,
      // Add hash/signature generation
    };

    // यहाँ से EaseBuzz को forward करें
    return await this.forwardToEaseBuzz(paymentData);
  }

  private async forwardToEaseBuzz(paymentData: any) {
    // EaseBuzz gateway को call करें
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/easebuzz/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    return await response.json();
  }

  async handleWebhook(webhookData: any) {
    // NGM से webhook receive करें
    // Process करें और EaseBuzz को forward करें
    return await this.processWebhook(webhookData);
  }

  private async processWebhook(webhookData: any) {
    // Webhook को process करें और database update करें
    // फिर client को notify करें
    return {
      status: 'success',
      message: 'Webhook processed successfully'
    };
  }
} 