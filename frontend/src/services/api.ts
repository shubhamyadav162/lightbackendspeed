/**
 * Simple API Service with API Key Authentication Only
 * Removed all Supabase authentication complexity
 */

// Simple API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app',
  defaultApiKey: 'admin_test_key', // Default admin key for testing
  timeout: 30000
};

console.log('🔧 API Configuration:', API_CONFIG);

// Simple HTTP client without authentication complexity
class SimpleApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': API_CONFIG.defaultApiKey
    };
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      console.log(`✅ API Response: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      console.error(`❌ API Error: ${error}`);
      throw error;
    }
  }

  async get(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'GET', headers });
  }

  async post(endpoint: string, data?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers
    });
  }

  async put(endpoint: string, data?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers
    });
  }

  async delete(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

// Create simple API client instance
const apiClient = new SimpleApiClient(API_CONFIG.baseURL);

// Simple API service functions
export const apiService = {
  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: 'Health check failed' };
    }
  },

  // List gateways
  async getGateways() {
    try {
      const response = await apiClient.get('/api/v1/admin/gateways');
      const data = await response.json();
      return { success: response.ok, data: data.data || data.gateways || [] };
    } catch (error) {
      console.error('Get gateways failed:', error);
      return { success: false, error: 'Failed to fetch gateways' };
    }
  },

  // Create gateway
  async createGateway(gatewayData: any) {
    try {
      console.log('📤 Creating gateway:', gatewayData);
      const response = await apiClient.post('/api/v1/admin/gateways', gatewayData);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Create gateway failed:', error);
      return { success: false, error: 'Failed to create gateway' };
    }
  },

  // Update gateway
  async updateGateway(gatewayId: string, gatewayData: any) {
    try {
      console.log('📤 Updating gateway:', gatewayId, gatewayData);
      const response = await apiClient.put(`/api/v1/admin/gateways/${gatewayId}`, gatewayData);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Update gateway failed:', error);
      return { success: false, error: 'Failed to update gateway' };
    }
  },

  // Process payment with simple API key
  async processPayment(paymentData: {
    amount: number;
    customer_email: string;
    customer_name?: string;
    customer_phone?: string;
    order_id?: string;
    description?: string;
    client_key?: string;
  }) {
    try {
      console.log('💰 Processing payment:', paymentData);
      
      const headers: Record<string, string> = {
        'x-api-key': paymentData.client_key || 'FQABLVIEYC' // Test client key
      };

      const response = await apiClient.post('/api/v1/pay', {
        amount: paymentData.amount,
        customer_email: paymentData.customer_email,
        customer_name: paymentData.customer_name,
        customer_phone: paymentData.customer_phone,
        order_id: paymentData.order_id,
        description: paymentData.description
      }, headers);

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Payment processed successfully:', data);
        return { success: true, data };
      } else {
        console.error('❌ Payment processing failed:', data);
        return { success: false, error: data.error || 'Payment processing failed' };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  },

  // Test connection
  async testConnection() {
    try {
      const response = await apiClient.get('/health');
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Backend connection successful',
          data: {
            status: data.status,
            timestamp: data.timestamp,
            service: data.service
          }
        };
      } else {
        return {
          success: false,
          error: 'Backend connection failed'
        };
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: 'Connection test failed'
      };
    }
  }
};

// Export default API client for custom requests
export default apiClient; 