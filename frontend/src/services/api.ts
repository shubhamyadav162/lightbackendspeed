/**
 * Simple API Service with API Key Authentication Only
 * Removed all Supabase authentication complexity
 */

import { supabase } from '../lib/supabase';

// Simple API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app',
  defaultApiKey: import.meta.env.VITE_API_KEY || 'admin_test_key', // Use env var or fallback for testing
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
      // No default API key here - will be handled dynamically
    };
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);

    // This constructs the headers correctly, avoiding the previous TypeScript error.
    // It ensures the API key is always included for our admin tool.
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        'x-api-key': API_CONFIG.defaultApiKey,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      // Log response status, but not the full text for security/privacy
      console.log(`✅ API Response: ${response.status} ${response.statusText}`);
      
      // CRITICAL FIX: The faulty block that tried to refresh JWT tokens on 401 is removed.
      // Now, if we get a 401, it will be returned directly to the caller,
      // unmasking the real issue.

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
  async getGateways(clientId?: string) {
    try {
      const headers = clientId ? { 'x-client-id': clientId } : {};
      const endpoint = '/api/v1/admin/gateways';
      console.log(`[FRONTEND_API] Calling getGateways endpoint: ${API_CONFIG.baseURL}${endpoint}`);
      const response = await apiClient.get(endpoint, headers);
      const data = await response.json();
      console.log('[FRONTEND_API] Received response for getGateways:', data);
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

  // Delete gateway
  async deleteGateway(gatewayId: string) {
    try {
      console.log('🗑️ Deleting gateway:', gatewayId);
      const response = await apiClient.delete(`/api/v1/admin/gateways/${gatewayId}`);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Delete gateway failed:', error);
      return { success: false, error: 'Failed to delete gateway' };
    }
  },

  // Bulk update gateway priority
  async bulkUpdateGatewayPriority(payload: { priorities: { id: string; priority: number }[] }) {
    try {
      console.log('🔄 Bulk updating gateway priorities:', payload);
      const response = await apiClient.post('/api/v1/admin/gateways/priorities', payload);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Bulk update gateway priority failed:', error);
      return { success: false, error: 'Failed to update priorities' };
    }
  },

  // Test gateway connection
  async testGateway(gatewayId: string) {
    try {
      console.log('🧪 Testing gateway connection:', gatewayId);
      const response = await apiClient.post(`/api/v1/admin/gateways/${gatewayId}/test`);
      const data = await response.json();
      if (response.ok) {
        return { success: true, ...data };
      }
      return { success: false, ...data };
    } catch (error) {
      console.error('Test gateway connection failed:', error);
      return { success: false, error: 'Failed to test gateway connection' };
    }
  },

  // Get queue system stats
  async getQueueSystemStats() {
    try {
      const response = await apiClient.get('/api/v1/admin/queues/stats');
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Get queue stats failed:', error);
      return { success: false, error: 'Failed to fetch queue stats' };
    }
  },

  // Retry queue jobs
  async retryQueueJobs(payload: { queue: string }) {
    try {
      console.log('🔄 Retrying jobs for queue:', payload.queue);
      const response = await apiClient.post(`/api/v1/admin/queues/${payload.queue}/retry`);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Retry queue jobs failed:', error);
      return { success: false, error: 'Failed to retry jobs' };
    }
  },
  
  // Pause queue
  async pauseQueue(payload: { queue: string, pause: boolean }) {
    try {
      const action = payload.pause ? 'pause' : 'resume';
      console.log(`⏯️ ${action.charAt(0).toUpperCase() + action.slice(1)} queue:`, payload.queue);
      const response = await apiClient.post(`/api/v1/admin/queues/${payload.queue}/${action}`);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Pause/Resume queue failed:', error);
      return { success: false, error: 'Failed to pause/resume queue' };
    }
  },

  // Clean queues
  async cleanQueues(payload: { queue: string }) {
    try {
      console.log('🧹 Cleaning queue:', payload.queue);
      const response = await apiClient.post(`/api/v1/admin/queues/${payload.queue}/clean`);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Clean queue failed:', error);
      return { success: false, error: 'Failed to clean queue' };
    }
  },

  // Get transactions
  async getTransactions(params?: any) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/api/v1/transactions?${query}`);
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Get transactions failed:', error);
      return { success: false, error: 'Failed to fetch transactions' };
    }
  },

  // Get wallets
  async getWallets() {
    try {
      const response = await apiClient.get('/api/v1/admin/wallets');
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Get wallets failed:', error);
      return { success: false, error: 'Failed to fetch wallets' };
    }
  },
  
  // Create client
  async createClient(clientData: any) {
    try {
      const response = await apiClient.post('/api/v1/admin/clients', clientData);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Create client failed:', error);
      return { success: false, error: 'Failed to create client' };
    }
  },
  
  // Update client
  async updateClient(clientId: string, updates: any) {
    try {
      const response = await apiClient.put(`/api/v1/admin/clients/${clientId}`, updates);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Update client failed:', error);
      return { success: false, error: 'Failed to update client' };
    }
  },

  // Get system status
  async getSystemStatus() {
    try {
      const response = await apiClient.get('/api/v1/system/status');
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Get system status failed:', error);
      return { success: false, error: 'Failed to fetch system status' };
    }
  },

  // Get analytics
  async getAnalytics(params?: { from?: string, to?: string, gateway?: string, merchantId?: string, timezone?: string }) {
    const searchParams = new URLSearchParams();
    if(params?.from) searchParams.set('from', params.from);
    if(params?.to) searchParams.set('to', params.to);
    if(params?.gateway) searchParams.set('gateway', params.gateway);
    if(params?.merchantId) searchParams.set('merchantId', params.merchantId);
    if(params?.timezone) searchParams.set('timezone', params.timezone);
    const response = await apiClient.get(`/api/v1/analytics?${searchParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Analytics API Error:', errorData);
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data; // The react-query hook expects the raw data for its 'data' property
  },

  // Get all merchants for admin
  async getMerchants() {
    try {
      const response = await apiClient.get('/api/v1/admin/merchants');
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Get merchants failed:', error);
      return { success: false, error: 'Failed to fetch merchants', data: [] };
    }
  },

  // Get merchant credentials
  async getMerchantCredentials(merchantId: string | null) {
    try {
      if (!merchantId) {
        return { success: true, data: null }; // Not an error, just no data to fetch
      }
      const response = await apiClient.get(`/api/v1/merchant/credentials?merchantId=${merchantId}`);
      const data = await response.json();
      return { success: response.ok, data: data || {} };
    } catch (error) {
      console.error('Get merchant credentials failed:', error);
      return { success: false, error: 'Failed to fetch credentials' };
    }
  },

  // Regenerate merchant credentials
  async regenerateMerchantCredentials(merchantId: string, label: string) {
    try {
      if (!merchantId) {
        throw new Error('Merchant ID is required to regenerate credentials.');
      }
      const response = await apiClient.post('/api/v1/merchant/credentials/regenerate', { merchantId, label });
      const data = await response.json();
      return { success: response.ok, data: data || {} };
    } catch (error) {
      console.error('Regenerate credentials failed:', error);
      return { success: false, error: 'Failed to regenerate credentials' };
    }
  },

  // Get merchant usage stats
  async getMerchantUsage(merchantId: string | null) {
    try {
      if (!merchantId) {
         return { success: true, data: null };
      }
      const response = await apiClient.get(`/api/v1/merchant/usage?merchantId=${merchantId}`);
      const data = await response.json();
      return { success: response.ok, data: data.data || {} };
    } catch (error) {
      console.error('Get merchant usage failed:', error);
      return { success: false, error: 'Failed to fetch usage data' };
    }
  },

  // Test webhook
  async testWebhook(params: { url: string, merchantId: string }) {
    try {
      const response = await apiClient.post('/api/v1/merchant/webhook/test', params);
      const data = await response.json();
      return { success: response.ok, data: data.data || {} };
    } catch (error) {
      console.error('Test webhook failed:', error);
      return { success: false, error: 'Failed to send test webhook' };
    }
  },

  // Get credential history
  async getCredentialHistory(merchantId: string) {
    try {
      if (!merchantId) {
        return { success: true, data: [] };
      }
      const response = await apiClient.get(`/api/v1/merchant/credentials/history?merchantId=${merchantId}`);
      const data = await response.json();
      return { success: response.ok, data: data || [] };
    } catch (error) {
      console.error('Get credential history failed:', error);
      return { success: false, error: 'Failed to fetch credential history' };
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
      
      // The client_key for payment processing should be handled by the backend
      // The request will be authenticated with the merchant's JWT
      const headers: Record<string, string> = {};
      if (paymentData.client_key) {
        headers['x-client-key'] = paymentData.client_key;
      }

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
      // Measure response time
      const startTime = performance.now();
      const response = await apiClient.get('/health');
      const duration = Math.round(performance.now() - startTime);

      const data = await response.json();

      // Common diagnostics payload (useful for UI debugging panel)
      const diagnostics = {
        url: `${API_CONFIG.baseURL}/health`,
        environment: import.meta.env.MODE,
      };

      if (response.ok) {
        return {
          success: true,
          duration,
          status: response.status,
          diagnostics,
          data: {
            status: data.status ?? data.message ?? 'ok',
            timestamp: data.timestamp ?? new Date().toISOString(),
            service: data.service ?? 'unknown',
          },
        };
      } else {
        return {
          success: false,
          duration,
          status: response.status,
          diagnostics,
          error: 'Backend connection failed',
        };
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error?.message || 'Connection test failed',
        diagnostics: {
          url: `${API_CONFIG.baseURL}/health`,
          environment: import.meta.env.MODE,
        },
      };
    }
  },

  // Setup One-to-One mapping
  async setupOneToOne(formData: {
    merchantId: string;
    apiKey: string;
    apiSalt: string;
    apiUrl?: string;
  }) {
    try {
      console.log('🔧 Setting up One-to-One mapping:', { merchantId: formData.merchantId, apiUrl: formData.apiUrl });
      const response = await apiClient.post('/api/v1/admin/setup-one-to-one', formData);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ One-to-One setup completed:', data);
        return { success: true, data: data.data || data };
      } else {
        console.error('❌ One-to-One setup failed:', data);
        return { success: false, error: data.error || 'Setup failed' };
      }
    } catch (error) {
      console.error('One-to-One setup error:', error);
      return { success: false, error: 'Setup request failed' };
    }
  },

  // Initiate payment with generated credentials
  async initiatePayment(paymentData: {
    amount: number;
    order_id: string;
    customer_email: string;
    customer_name?: string;
  }, credentials: {
    client_key: string;
    client_salt: string;
  }) {
    try {
      console.log('💳 Initiating payment with LightSpeed credentials');
      const response = await apiClient.post('/api/v1/payment/initiate', paymentData, {
        'x-api-key': credentials.client_key,
        'x-api-secret': credentials.client_salt
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Payment initiated successfully:', data);
        return { success: true, data };
      } else {
        console.error('❌ Payment initiation failed:', data);
        return { success: false, error: data.error || 'Payment initiation failed' };
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return { success: false, error: 'Payment request failed' };
    }
  },
};

export const testBackendConnection = apiService.testConnection;

// Export default API client for custom requests
export { apiClient };

// -------------------- Real-time Subscription STUBS --------------------
// NOTE: Backend WebSocket/Realtime implementation अभी नहीं है।
// ये स्टब्स compile-time errors हटाने और graceful no-op functionality के लिए हैं।
// भविष्य में इन्हें असली realtime implementation (WebSocket/SSE) से replace किया जा सकता है।

export function subscribeToGatewayHealth(callback: (payload: any) => void) {
  console.warn('[subscribeToGatewayHealth] Realtime subscription स्टब active – वास्तविक realtime अभी implement नहीं है।');
  // Call callback once with dummy payload
  setTimeout(() => {
    try {
      callback({ 
        event: 'init', 
        gateway_id: 'stub',
        response_time_ms: 100,
        is_available: true
      });
    } catch (err) {
      console.warn('subscribeToGatewayHealth callback error', err);
    }
  }, 0);

  return {
    unsubscribe() {
      console.log('[subscribeToGatewayHealth] Stub unsubscribed');
    }
  };
}

export function subscribeToTransactions(callback: (payload: any) => void) {
  console.warn('[subscribeToTransactions] Realtime subscription स्टब active – वास्तविक realtime अभी implement नहीं है।');
  // Call callback once with dummy payload ताकि UI में "no data" state न टूटे।
  setTimeout(() => {
    try {
      callback({ event: 'init', message: 'Stub subscription started' });
    } catch (err) {
      console.warn('subscribeToTransactions callback error', err);
    }
  }, 0);

  return {
    unsubscribe() {
      console.log('[subscribeToTransactions] Stub unsubscribed');
    }
  };
}

export function subscribeToSystemStatus(callback: (payload: any) => void) {
  console.warn('[subscribeToSystemStatus] Realtime subscription stub active – real implementation pending.');
  // Dummy implementation to prevent crashes
  setTimeout(() => {
    try {
      callback({ event: 'init', message: 'System status stub subscription started' });
    } catch (err) {
      console.warn('subscribeToSystemStatus callback error', err);
    }
  }, 0);

  return {
    unsubscribe() {
      console.log('[subscribeToSystemStatus] Stub unsubscribed');
    }
  };
}

export function subscribeToQueueMetrics(callback: (payload: any) => void) {
  console.warn('[subscribeToQueueMetrics] Realtime subscription stub active – replace with supabase channel as needed.');
  // TODO: Replace stub with actual Supabase realtime channel if backend emits queue_metrics_stream
  const interval = setInterval(() => {
    callback({ timestamp: new Date().toISOString(), cpu: Math.random() * 100, memory: Math.random() * 100, network: Math.random() * 100, transactions: Math.floor(Math.random() * 1000) });
  }, 5000);

  return {
    unsubscribe() {
      clearInterval(interval);
    }
  };
}

export function subscribeToTransactionStream(callback: (payload: any) => void) {
  console.warn('[subscribeToTransactionStream] Realtime subscription stub active – replace with real-time events.');
  const interval = setInterval(() => {
    callback({ id: `txn_${Date.now()}`, gateway: 'MockGateway', amount: Math.random()*1000, status: ['success','failed','pending'][Math.floor(Math.random()*3)], response_time: Math.floor(Math.random()*500) });
  }, 4000);
  return {
    unsubscribe() {
      clearInterval(interval);
    }
  };
}

// ---------------------------------------------------------------------- 