import { BaseGatewayAdapter, GatewayCredentials } from './base-adapter';
import { RazorpayAdapter } from './razorpay-adapter';
import { PayUAdapter } from './payu-adapter';
import { EasebuzzAdapter } from './easebuzz-adapter';

export type SupportedProvider = 'razorpay' | 'payu' | 'easebuzz' | 'cashfree' | 'paytm' | 'phonepe' | 'custom';

export class GatewayFactory {
  private static instance: GatewayFactory;

  private constructor() {}

  public static getInstance(): GatewayFactory {
    if (!GatewayFactory.instance) {
      GatewayFactory.instance = new GatewayFactory();
    }
    return GatewayFactory.instance;
  }

  /**
   * Create a gateway adapter instance based on provider type
   */
  public createAdapter(provider: SupportedProvider, credentials: GatewayCredentials, isTestMode = false): BaseGatewayAdapter {
    switch (provider) {
      case 'razorpay':
        return new RazorpayAdapter(this.validateRazorpayCredentials(credentials), isTestMode);
      
      case 'payu':
        return new PayUAdapter(this.validatePayUCredentials(credentials), isTestMode);
      
      case 'easebuzz':
        return new EasebuzzAdapter(this.validateEasebuzzCredentials(credentials), isTestMode);
      
      // Add more cases as adapters are implemented
      // case 'cashfree':
      //   return new CashfreeAdapter(this.validateCashfreeCredentials(credentials), isTestMode);
      
      // case 'paytm':
      //   return new PaytmAdapter(this.validatePaytmCredentials(credentials), isTestMode);
      
      // case 'phonepe':
      //   return new PhonePeAdapter(this.validatePhonePeCredentials(credentials), isTestMode);
      
      default:
        throw new Error(`Unsupported payment gateway provider: ${provider}`);
    }
  }

  /**
   * Validate and structure Razorpay credentials
   */
  private validateRazorpayCredentials(credentials: GatewayCredentials) {
    const { api_key, api_secret, webhook_secret } = credentials;
    
    if (!api_key || !api_secret) {
      throw new Error('Razorpay requires api_key and api_secret');
    }

    return {
      api_key: api_key as string,
      api_secret: api_secret as string,
      webhook_secret: webhook_secret as string | undefined
    };
  }

  /**
   * Validate and structure PayU credentials
   */
  private validatePayUCredentials(credentials: GatewayCredentials) {
    const { merchant_key, salt, auth_header } = credentials;
    
    if (!merchant_key || !salt) {
      throw new Error('PayU requires merchant_key and salt');
    }

    return {
      merchant_key: merchant_key as string,
      salt: salt as string,
      auth_header: auth_header as string | undefined
    };
  }

  /**
   * Validate and structure Easebuzz credentials
   */
  private validateEasebuzzCredentials(credentials: GatewayCredentials): GatewayCredentials {
    const { api_key, api_secret, webhook_secret } = credentials;
    
    if (!api_key || !api_secret) {
      throw new Error('Easebuzz requires api_key (merchant key) and api_secret (salt)');
    }

    return {
      api_key: api_key as string,
      api_secret: api_secret as string,
      webhook_secret: webhook_secret as string | undefined
    };
  }

  /**
   * Validate and structure Cashfree credentials  
   */
  private validateCashfreeCredentials(credentials: GatewayCredentials) {
    const { app_id, secret_key, environment } = credentials;
    
    if (!app_id || !secret_key) {
      throw new Error('Cashfree requires app_id and secret_key');
    }

    return {
      app_id: app_id as string,
      secret_key: secret_key as string,
      environment: environment as string || 'TEST'
    };
  }

  /**
   * Validate and structure Paytm credentials
   */
  private validatePaytmCredentials(credentials: GatewayCredentials) {
    const { merchant_id, merchant_key, website, industry_type, channel_id } = credentials;
    
    if (!merchant_id || !merchant_key) {
      throw new Error('Paytm requires merchant_id and merchant_key');
    }

    return {
      merchant_id: merchant_id as string,
      merchant_key: merchant_key as string,
      website: website as string || 'WEBSTAGING',
      industry_type: industry_type as string || 'Retail',
      channel_id: channel_id as string || 'WEB'
    };
  }

  /**
   * Get supported providers list
   */
  public getSupportedProviders(): SupportedProvider[] {
    return ['razorpay', 'payu', 'easebuzz', 'cashfree', 'paytm', 'phonepe', 'custom'];
  }

  /**
   * Get required credential fields for a specific provider
   */
  public getRequiredCredentials(provider: SupportedProvider): string[] {
    switch (provider) {
      case 'razorpay':
        return ['api_key', 'api_secret'];
      
      case 'payu':
        return ['merchant_key', 'salt'];
      
      case 'easebuzz':
        return ['api_key', 'api_secret']; // api_key = merchant key, api_secret = salt
      
      case 'cashfree':
        return ['app_id', 'secret_key'];
      
      case 'paytm':
        return ['merchant_id', 'merchant_key', 'website', 'industry_type'];
      
      case 'phonepe':
        return ['merchant_id', 'salt_key', 'salt_index'];
      
      case 'custom':
        return ['api_endpoint_url', 'api_key', 'api_secret'];
      
      default:
        return [];
    }
  }

  /**
   * Get optional credential fields for a specific provider
   */
  public getOptionalCredentials(provider: SupportedProvider): string[] {
    switch (provider) {
      case 'razorpay':
        return ['webhook_secret'];
      
      case 'payu':
        return ['auth_header'];
      
      case 'easebuzz':
        return ['webhook_secret'];
      
      case 'cashfree':
        return ['environment'];
      
      case 'paytm':
        return ['channel_id'];
      
      case 'phonepe':
        return ['environment'];
      
      case 'custom':
        return ['webhook_secret', 'additional_headers'];
      
      default:
        return [];
    }
  }

  /**
   * Validate if credentials are complete for a provider
   */
  public validateCredentials(provider: SupportedProvider, credentials: GatewayCredentials): { valid: boolean; missing: string[] } {
    const required = this.getRequiredCredentials(provider);
    const missing = required.filter(field => !credentials[field]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
} 