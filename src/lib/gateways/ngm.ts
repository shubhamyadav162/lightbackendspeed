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
    try {
      // NGM को payment request भेजें
      const paymentData = {
        merchant_id: this.config.merchantId,
        amount: params.amount,
        order_id: params.orderId,
        customer_email: params.customerEmail,
        customer_name: params.customerName,
        return_url: params.returnUrl,
        webhook_url: params.webhookUrl,
        // Add hash/signature generation here if needed
      };

      // यहाँ से EaseBuzz को forward करें
      return await this.forwardToEaseBuzz(paymentData);
    } catch (error) {
      console.error('NGM Payment Error:', error);
      throw new Error('Payment initiation failed');
    }
  }

  private async forwardToEaseBuzz(paymentData: any) {
    try {
      // EaseBuzz gateway को call करें
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3100';
      const response = await fetch(`${baseUrl}/api/v1/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EASEBUZZ_API_KEY || 'FQABLVIEYC',
          'x-api-secret': process.env.EASEBUZZ_API_SECRET || 'QECGU7UHNT',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          customer_email: paymentData.customer_email,
          customer_name: paymentData.customer_name,
          order_id: paymentData.order_id,
          return_url: paymentData.return_url,
          webhook_url: paymentData.webhook_url,
        })
      });

      if (!response.ok) {
        throw new Error(`EaseBuzz API Error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('EaseBuzz Forward Error:', error);
      throw new Error('Failed to forward to EaseBuzz');
    }
  }

  async handleWebhook(webhookData: any) {
    try {
      // NGM से webhook receive करें
      // Process करें और EaseBuzz को forward करें
      return await this.processWebhook(webhookData);
    } catch (error) {
      console.error('NGM Webhook Error:', error);
      throw new Error('Webhook processing failed');
    }
  }

  private async processWebhook(webhookData: any) {
    try {
      // Webhook को process करें और database update करें
      // फिर client को notify करें
      return {
        status: 'success',
        message: 'Webhook processed successfully',
        data: webhookData
      };
    } catch (error) {
      console.error('Webhook Process Error:', error);
      throw new Error('Webhook processing failed');
    }
  }
} 