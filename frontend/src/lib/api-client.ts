import { createClient } from '@supabase/supabase-js';
import axios, { AxiosHeaders } from 'axios';

// Environment configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_KEY = import.meta.env.VITE_API_KEY || 'admin_test_key';

/**
 * Resolve backend base URL in the following order:
 * 1. Explicit `VITE_API_BASE_URL`
 * 2. Explicit `VITE_BACKEND_URL` (appends `/api/v1` automatically)
 * 3. Production Railway URL if in production
 * 4. Fallback to local dev server `http://localhost:3100/api/v1`
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api/v1` : null) ||
  (import.meta.env.PROD ? 'https://web-production-0b337.up.railway.app/api/v1' : null) ||
  'http://localhost:3100/api/v1';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || API_BASE_URL?.replace(/\/api\/v1$/, '') || '';

// Log configuration for debugging
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  BACKEND_URL,
  SUPABASE_URL,
  ENV_VARS: {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  }
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
  withCredentials: false, // Explicitly disable credentials for CORS
});

// Add request interceptor to handle auth and errors
apiClient.interceptors.request.use(
  (config) => {
    // Only add x-api-key as needed, not for OPTIONS requests
    if (config.method !== 'options') {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      config.headers['x-api-key'] = API_KEY;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      baseURL: error.config?.baseURL
    };
    
    console.error('❌ API Error:', errorInfo);
    
    // Handle specific CORS errors
    if (error.message === 'Network Error' && !error.response) {
      console.error('🚫 CORS or Network Error detected!');
      console.error('📍 Check if backend URL is correct:', API_BASE_URL);
      console.error('📍 Ensure backend is running and accessible');
      console.error('📍 Verify CORS configuration on backend');
    }
    
    return Promise.reject(error);
  }
);

// Supabase Edge Functions client (Alternative path)
export const edgeFunctionClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  withCredentials: false,
});

// API service methods
export const apiService = {
  // Gateway Management
  async getGateways() {
    const response = await apiClient.get('/admin/gateways');
    return response.data;
  },

  async createGateway(gateway: any) {
    const response = await apiClient.post('/admin/gateways', gateway);
    return response.data;
  },

  async updateGateway(id: string, updates: any) {
    const response = await apiClient.patch(`/admin/gateways/${id}`, updates);
    return response.data;
  },

  // Transaction Management
  async getTransactions(params?: any) {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  },

  async createTransaction(transaction: any) {
    const response = await apiClient.post('/pay', transaction);
    return response.data;
  },

  // Wallet Management
  async getWallets() {
    const response = await apiClient.get('/wallets');
    return response.data;
  },

  async adjustWalletBalance(walletId: string, adjustment: any) {
    const response = await apiClient.post('/wallets', { walletId, ...adjustment });
    return response.data;
  },

  // System Status
  async getSystemStatus() {
    const response = await apiClient.get('/system/status');
    return response.data;
  },

  // Queue Monitoring
  async getQueueStats() {
    const response = await apiClient.get('/admin/queues');
    return response.data;
  },

  async drainQueue(queueName: string) {
    const response = await apiClient.post(`/admin/queues/${queueName}/drain`);
    return response.data;
  },

  // Alerts
  async getAlerts() {
    const response = await apiClient.get('/alerts');
    return response.data;
  },

  async resolveAlert(alertId: string) {
    const response = await apiClient.patch(`/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Analytics
  async getAnalytics(params?: any) {
    const response = await apiClient.get('/analytics', { params });
    return response.data;
  },

  // Commission Ledger
  async getCommissionLedger() {
    const response = await apiClient.get('/admin/commission/ledger');
    return response.data;
  },

  // WhatsApp Logs
  async getWhatsAppLogs(params?: any) {
    const response = await apiClient.get('/admin/whatsapp', { params });
    return response.data;
  },

  // Client Management
  async getClients() {
    const response = await apiClient.get('/clients');
    return response.data;
  },

  async createClient(client: any) {
    const response = await apiClient.post('/clients', client);
    return response.data;
  },

  async updateClient(id: string, updates: any) {
    const response = await apiClient.patch(`/clients/${id}`, updates);
    return response.data;
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

export const subscribeToWallets = (callback: (payload: any) => void) => {
  return supabase
    .channel('wallet_transactions')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'wallet_transactions' 
    }, callback)
    .subscribe();
};

// Helper function for API calls with error handling
const apiCall = async (method: string, endpoint: string, data?: any, headers?: any) => {
  try {
    const response = await apiClient({
      method,
      url: endpoint,
      data,
      headers
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error);
    throw error;
  }
}; 