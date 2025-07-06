import axios, { AxiosHeaders } from 'axios';

// Simple environment configuration
const API_KEY = import.meta.env.VITE_API_KEY || 'admin_test_key';

/**
 * Smart backend URL resolution with proxy support:
 * 1. Development: Use proxy path /api/v1 (avoids CORS issues)
 * 2. Production: Use VITE_API_BASE_URL if provided
 * 3. Fallback: Use VITE_BACKEND_URL + /api/v1 if provided  
 * 4. Final fallback: Railway URL for production
 */
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/v1'  // Use proxy in development mode
  : import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api/v1` : null) ||
    'https://web-production-0b337.up.railway.app/api/v1';

// Log configuration for debugging
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  API_KEY: API_KEY ? '✅ Set' : '❌ Missing',
  ENV_MODE: import.meta.env.MODE
});

// Simple Axios client for API calls
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  withCredentials: false,
});

// Optimized request interceptor with throttled logging
let lastLogTime = 0;
const LOG_THROTTLE_MS = 1000; // Only log once per second per type

apiClient.interceptors.request.use(
  (config) => {
    const now = Date.now();
    if (now - lastLogTime > LOG_THROTTLE_MS) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      lastLogTime = now;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optimized response interceptor with throttled logging and performance improvements
let lastResponseLogTime = 0;
apiClient.interceptors.response.use(
  (response) => {
    const now = Date.now();
    if (now - lastResponseLogTime > LOG_THROTTLE_MS) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      lastResponseLogTime = now;
    }
    return response;
  },
  (error) => {
    // Only log errors, not all responses to reduce console spam
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.message
    };
    
    console.error('❌ API Error:', errorDetails);
    
    if (error.message === 'Network Error' && !error.response) {
      console.error('🚫 Network/CORS Error - Check backend connection');
    }
    
    return Promise.reject(error);
  }
);

// Simple API service methods
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
  }
};

// Simple connection test
export const testBackendConnection = async () => {
  console.log('🔗 Testing backend connection to:', API_BASE_URL);
  try {
    const response = await apiClient.get('/system/status');
    console.log('✅ Backend connection successful');
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    throw error;
  }
}; 