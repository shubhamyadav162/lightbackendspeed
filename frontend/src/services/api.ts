import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Environment configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100/api/v1';

console.log('API Configuration:', {
  SUPABASE_URL: SUPABASE_URL ? '✓ Set' : '✗ Missing',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
  API_BASE_URL,
});

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Axios client for API calls
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  // Try to get token from localStorage or Supabase session
  const token = localStorage.getItem('access_token') || SUPABASE_ANON_KEY;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add API key for lightspeedpay-integrated routes
  config.headers['x-api-key'] = 'admin_test_key'; // Default test key
  
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.warn(`Endpoint not found: ${error.config?.url}`);
    }
    
    return Promise.reject(error);
  }
);

// Connection test method
export const testBackendConnection = async () => {
  try {
    const response = await apiClient.get('/system/status');
    console.log('✅ Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Backend connection failed, using fallback mode');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed',
      fallback: true 
    };
  }
};

// API service methods
export const apiService = {
  // Gateway Management
  async getGateways() {
    try {
      const response = await apiClient.get('/admin/gateways');
      return response.data;
    } catch (error) {
      console.error('Error fetching gateways:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'Razorpay Gateway',
          provider: 'razorpay',
          status: 'active',
          success_rate: 99.5,
          current_volume: 150000,
          monthly_limit: 1000000,
        },
        {
          id: '2',
          name: 'PayU Gateway',
          provider: 'payu',
          status: 'active',
          success_rate: 98.8,
          current_volume: 85000,
          monthly_limit: 800000,
        }
      ];
    }
  },

  async createGateway(gateway: any) {
    const response = await apiClient.post('/admin/gateways', gateway);
    return response.data;
  },

  async updateGateway(id: string, updates: any) {
    const response = await apiClient.patch(`/admin/gateways/${id}`, updates);
    return response.data;
  },

  async deleteGateway(id: string) {
    const response = await apiClient.delete(`/admin/gateways/${id}`);
    return response.data;
  },

  async getGatewayHealth() {
    const response = await apiClient.get('/admin/gateways/health');
    return response.data;
  },

  async testGateway(id: string) {
    const response = await apiClient.post(`/admin/gateways/${id}/test`);
    return response.data;
  },

  async bulkUpdateGatewayPriority(payload: { priorities: { id: string; priority: number }[] }) {
    const response = await apiClient.put('/admin/gateways/priority', payload);
    return response.data;
  },

  // Transaction Management
  async getTransactions(params?: any) {
    try {
      const response = await apiClient.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          amount: 10000,
          status: 'success',
          gateway: 'razorpay',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          amount: 5000,
          status: 'pending',
          gateway: 'payu',
          created_at: new Date().toISOString(),
        }
      ];
    }
  },

  // Wallet Management
  async getWallets() {
    try {
      const response = await apiClient.get('/wallets');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }
  },

  // System Status
  async getSystemStatus() {
    try {
      const response = await apiClient.get('/system/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching system status:', error);
      // Return mock status for development
      return {
        payment_processing: { status: 'operational', uptime: '99.9%' },
        api_services: { status: 'operational', uptime: '99.8%' },
        database: { status: 'operational', uptime: '99.5%' },
        external_gateways: { status: 'operational', uptime: '99.7%' },
      };
    }
  },

  // Queue Monitoring
  async getQueueStats() {
    try {
      const response = await apiClient.get('/admin/queues');
      return response.data;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      // Return mock queue data for development
      return [
        { queue_name: 'transaction-processing', waiting: 5, active: 2, completed: 1250, failed: 3 },
        { queue_name: 'webhook-processing', waiting: 2, active: 1, completed: 800, failed: 1 },
        { queue_name: 'whatsapp-notifications', waiting: 0, active: 0, completed: 150, failed: 0 }
      ];
    }
  },

  // Alerts
  async getAlerts() {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  // Analytics
  async getAnalytics(params?: any) {
    try {
      const response = await apiClient.get('/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return mock analytics for development
      return {
        today_volume: 89247000, // In paisa
        volume_change: '+8.4%',
        success_rate_change: '-0.2%',
        failed_change: '+15%',
        transaction_change: '+12%',
      };
    }
  },

  // Queue Management
  async listQueues() {
    const response = await apiClient.get('/admin/queues');
    return response.data;
  },

  async retryQueueJobs(payload: { queue?: string; jobIds?: string[]; delay?: number }) {
    const response = await apiClient.post('/admin/queues/retry', payload);
    return response.data;
  },

  async cleanQueues(payload: { queue?: string; olderThan?: string }) {
    const response = await apiClient.delete('/admin/queues/clean', { data: payload });
    return response.data;
  },

  async getQueueSystemStats() {
    const response = await apiClient.get('/admin/queues/stats');
    return response.data;
  },

  async pauseQueue(payload: { queue: string; pause: boolean }) {
    const response = await apiClient.post('/admin/queues/pause', payload);
    return response.data;
  },

  async getJobDetails(id: string) {
    const response = await apiClient.get(`/admin/queues/jobs/${id}`);
    return response.data;
  },

  // Developer Tools - Merchant
  async getMerchantCredentials() {
    const response = await apiClient.get('/merchant/credentials');
    return response.data;
  },

  async regenerateMerchantCredentials() {
    const response = await apiClient.post('/merchant/credentials/regenerate');
    return response.data;
  },

  async getMerchantUsage() {
    const response = await apiClient.get('/merchant/usage');
    return response.data;
  },

  async testWebhookEndpoint(payload: { url: string }) {
    const response = await apiClient.post('/merchant/webhooks/test', payload);
    return response.data;
  },

  async getAuditLogs(params?: { limit?: number; cursor?: string; processed?: boolean; action?: string }) {
    try {
      const response = await apiClient.get('/admin/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], nextCursor: null };
    }
  },
};

// Real-time subscriptions for dashboard updates
export const subscribeToTransactions = (callback: (payload: any) => void) => {
  return supabase
    .channel('transactions')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'transactions' 
    }, callback)
    .subscribe();
};

export const subscribeToAlerts = (callback: (payload: any) => void) => {
  return supabase
    .channel('alerts')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'alerts' 
    }, callback)
    .subscribe();
};

// == Queue Metrics SSE subscription ==
export const subscribeToQueueMetrics = (callback: (metric: any) => void) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base.replace(/\/functions\/v1$/, '')}/functions/v1/queue-stats-stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'metric') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  };

  return () => es.close();
};

// == Gateway Health SSE subscription ==
export const subscribeToGatewayHealth = (callback: (metric: any) => void) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base.replace(/\/functions\/v1$/, '')}/functions/v1/gateway-health-stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'metric') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  };

  return () => es.close();
};

// == Transaction SSE subscription ==
export const subscribeToTransactionStream = (callback: (txn: any) => void) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base.replace(/\/functions\/v1$/, '')}/functions/v1/transaction-stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'insert' || parsed.type === 'update') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse transaction SSE payload', err);
    }
  };

  return () => es.close();
};

// == Audit Logs SSE subscription ==
export const subscribeToAuditLogs = (callback: (log: any) => void) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base.replace(/\/functions\/v1$/, '')}/functions/v1/audit-logs-stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'log') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse audit log SSE payload', err);
    }
  };

  return () => es.close();
};

// == System Status SSE subscription ==
export const subscribeToSystemStatus = (callback: (status: any) => void) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base.replace(/\/functions\/v1$/, '')}/functions/v1/system-status-stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'insert' || parsed.type === 'update') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse system-status SSE payload', err);
    }
  };

  return () => es.close();
}; 