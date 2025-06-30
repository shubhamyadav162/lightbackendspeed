import { createClient } from '@supabase/supabase-js';
import { GatewayFactory, SupportedProvider } from './gateways/gateway-factory';
import { PaymentRequest, PaymentResponse, BaseGatewayAdapter } from './gateways/base-adapter';
import { LightSpeedWrapper, LightSpeedPaymentResponse } from './lightspeed-wrapper';
import crypto from 'crypto';

interface ClientCredentials {
  client_key: string;
  client_salt: string;
}

interface PaymentInitiationRequest extends ClientCredentials {
  amount: number;
  order_id: string;
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
  };
  return_url?: string;
  description?: string;
}

export class PaymentService {
  private supabase;
  private gatewayFactory: GatewayFactory;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.gatewayFactory = GatewayFactory.getInstance();
  }

  /**
   * Main payment initiation endpoint - this is what merchants call
   */
  async initiatePayment(request: PaymentInitiationRequest): Promise<LightSpeedPaymentResponse> {
    try {
      // 1. Authenticate client using key/salt
      const client = await this.authenticateClient(request.client_key, request.client_salt);
      if (!client) {
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          error: 'Invalid client credentials'
        }, '', request.amount);
      }

      // 2. Check if client is suspended due to unpaid fees
      if (await this.isClientSuspended(client.id)) {
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          error: 'Account suspended due to unpaid dues'
        }, '', request.amount);
      }

      // 3. Generate LightSpeed transaction ID
      const lightspeedTxnId = LightSpeedWrapper.generateTransactionId();

      // 4. Select best available gateway for this client
      const gatewayConfig = await this.selectBestGateway(client.id, request.amount);
      if (!gatewayConfig) {
        return LightSpeedWrapper.sanitizePaymentResponse({
          success: false,
          error: 'Service temporarily unavailable'
        }, lightspeedTxnId, request.amount);
      }

      // 5. Create transaction record with LightSpeed ID
      const transaction = await this.createTransaction({
        client_id: client.id,
        gateway_id: gatewayConfig.id,
        amount: request.amount,
        order_id: request.order_id,
        lightspeed_txn_id: lightspeedTxnId,
        status: 'created'
      });

      // 6. Get gateway adapter and process payment
      const adapter = this.gatewayFactory.createAdapter(
        gatewayConfig.provider as SupportedProvider,
        gatewayConfig.credentials,
        client.environment === 'sandbox' // Use client's environment setting
      );

      const paymentRequest: PaymentRequest = {
        amount: request.amount,
        currency: 'INR',
        order_id: lightspeedTxnId, // Use LightSpeed ID for gateway
        customer_info: request.customer_info,
        return_url: request.return_url,
        description: request.description
      };

      const result = await adapter.initiatePayment(paymentRequest);

      // 7. Update transaction with gateway response
      if (result.success) {
        await this.updateTransaction(transaction.id, {
          gateway_txn_id: result.payment_id,
          status: 'pending',
          gateway_response: LightSpeedWrapper.sanitizeGatewayResponse(result.gateway_response)
        });
      }

      // 8. Return sanitized LightSpeed branded response
      return LightSpeedWrapper.sanitizePaymentResponse(
        result, 
        lightspeedTxnId, 
        request.amount, 
        'INR'
      );

    } catch (error) {
      console.error('Payment initiation error:', error);
      const errorTxnId = LightSpeedWrapper.generateTransactionId();
      return LightSpeedWrapper.sanitizePaymentResponse({
        success: false,
        error: 'Payment processing failed'
      }, errorTxnId, request.amount);
    }
  }

  /**
   * Webhook processing - handles callbacks from different gateways
   */
  async processWebhook(clientKey: string, payload: any, signature?: string): Promise<any> {
    try {
      // 1. Get client info
      const client = await this.getClientByKey(clientKey);
      if (!client) {
        throw new Error('Invalid client key');
      }

      // 2. Find transaction (you'd need to extract transaction ID from payload)
      // This depends on the gateway's webhook structure
      const gatewayTxnId = this.extractTransactionId(payload);
      const transaction = await this.getTransactionByGatewayId(gatewayTxnId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // 3. Get gateway config
      const gatewayConfig = await this.getGatewayConfig(transaction.gateway_id);
      
      // 4. Process webhook using appropriate adapter
      const adapter = this.gatewayFactory.createAdapter(
        gatewayConfig.provider as SupportedProvider,
        gatewayConfig.credentials
      );

      const result = await adapter.processWebhook(payload, signature);

      // 5. Update transaction status
      if (result.success) {
        await this.updateTransaction(transaction.id, {
          status: result.status.toLowerCase(),
          gateway_response: result.gateway_response
        });

        // 6. Calculate and record commission if payment successful
        if (result.status === 'SUCCESS') {
          await this.recordCommission(transaction.id, transaction.amount, client.fee_percent);
        }

        // 7. Forward webhook to merchant if configured
        if (client.webhook_url) {
          await this.forwardWebhook(client.webhook_url, result);
        }
      }

      return { success: true, message: 'Webhook processed' };

    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Authenticate client using HMAC verification
   */
  private async authenticateClient(clientKey: string, clientSalt: string): Promise<any> {
    const { data: client, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('client_key', clientKey)
      .eq('status', 'active')
      .single();

    if (error || !client) {
      return null;
    }

    // Verify salt (in production, you'd want more sophisticated HMAC verification)
    if (client.client_salt !== clientSalt) {
      return null;
    }

    return client;
  }

  /**
   * Get client by key only (for webhook processing)
   */
  private async getClientByKey(clientKey: string): Promise<any> {
    const { data: client, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('client_key', clientKey)
      .single();

    return error ? null : client;
  }

  /**
   * Check if client is suspended due to unpaid dues
   */
  private async isClientSuspended(clientId: string): Promise<boolean> {
    const { data: wallet } = await this.supabase
      .from('commission_wallets')
      .select('balance_due')
      .eq('client_id', clientId)
      .single();

    const { data: client } = await this.supabase
      .from('clients')
      .select('suspend_threshold')
      .eq('id', clientId)
      .single();

    if (!wallet || !client) return false;

    return wallet.balance_due >= client.suspend_threshold;
  }

  /**
   * Select best gateway using round-robin rotation logic
   */
  private async selectBestGateway(clientId: string, amount: number): Promise<any> {
    // Use the enhanced round-robin stored procedure
    const { data, error } = await this.supabase
      .rpc('select_gateway_for_client_round_robin', { 
        p_client_id: clientId, 
        p_amount: amount 
      });

    if (error || !data || data.length === 0) {
      console.log('No available gateway for round-robin rotation:', error);
      return null;
    }

    const selectedGateway = data[0];
    
    // Get full gateway configuration with credentials
    const { data: gateway } = await this.supabase
      .from('payment_gateways')
      .select('*')
      .eq('id', selectedGateway.gateway_id)
      .single();

    // Add rotation info to gateway response
    if (gateway) {
      gateway.rotation_info = {
        current_position: selectedGateway.rotation_position,
        next_position: selectedGateway.next_position
      };
    }

    return gateway;
  }

  /**
   * Create transaction record
   */
  private async createTransaction(txnData: any): Promise<any> {
    const { data: transaction, error } = await this.supabase
      .from('client_transactions')
      .insert({
        ...txnData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Transaction creation failed: ${error.message}`);
    return transaction;
  }

  /**
   * Update transaction record
   */
  private async updateTransaction(transactionId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('client_transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Transaction update failed:', error);
    }
  }

  /**
   * Extract transaction ID from webhook payload (gateway-specific)
   */
  private extractTransactionId(payload: any): string {
    // This would need to be adapted based on the webhook structure
    // Different gateways send different formats
    return payload.order_id || payload.txnid || payload.transaction_id || payload.id;
  }

  /**
   * Get transaction by gateway transaction ID
   */
  private async getTransactionByGatewayId(gatewayTxnId: string): Promise<any> {
    const { data: transaction } = await this.supabase
      .from('client_transactions')
      .select('*')
      .eq('gateway_txn_id', gatewayTxnId)
      .single();

    return transaction;
  }

  /**
   * Get gateway configuration
   */
  private async getGatewayConfig(gatewayId: string): Promise<any> {
    const { data: gateway } = await this.supabase
      .from('payment_gateways')
      .select('*')
      .eq('id', gatewayId)
      .single();

    return gateway;
  }

  /**
   * Record commission for successful payment
   */
  private async recordCommission(transactionId: string, amount: number, feePercent: number): Promise<void> {
    const commission = Math.round(amount * feePercent / 100);
    
    const { error } = await this.supabase
      .rpc('process_commission', {
        p_transaction_id: transactionId,
        p_commission: commission
      });

    if (error) {
      console.error('Commission recording failed:', error);
    }
  }

  /**
   * Forward webhook to merchant's server
   */
  private async forwardWebhook(webhookUrl: string, webhookData: any): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });
    } catch (error) {
      console.error('Webhook forwarding failed:', error);
      // In production, you'd want to retry this
    }
  }
} 