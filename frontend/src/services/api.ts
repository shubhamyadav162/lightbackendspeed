import { createClient } from '@supabase/supabase-js';
import axios, { InternalAxiosRequestConfig } from 'axios';

// Extend Axios config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number };
  retryCount?: number;
}

// Environment configuration with enhanced validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_KEY = import.meta.env.VITE_API_KEY || 'admin_test_key';
const DEBUG_LOGS = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '15000');
const RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3');

// API Base URL with fallbacks and validation
const getApiBaseUrl = () => {
  const configUrl = import.meta.env.VITE_API_BASE_URL;
  if (configUrl) {
    DEBUG_LOGS && console.log('✅ Using configured API URL:', configUrl);
    return configUrl;
  }
  
  // Environment-based fallbacks
  if (import.meta.env.DEV) {
    DEBUG_LOGS && console.log('🔧 Development mode - using localhost');
    return 'http://localhost:3100/api/v1';
  }
  
  // Production fallback
  const prodUrl = 'https://web-production-0b337.up.railway.app/api/v1';
  DEBUG_LOGS && console.log('🚀 Production mode - using Railway URL:', prodUrl);
  return prodUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Enhanced configuration logging
console.log('🔧 API Configuration:', {
  SUPABASE_URL: SUPABASE_URL ? `✅ ${SUPABASE_URL.substring(0, 30)}...` : '❌ Missing',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
  API_BASE_URL,
  API_KEY: API_KEY ? '✅ Set' : '❌ Missing',
  MODE: import.meta.env.MODE,
  DEBUG_LOGS,
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS
});

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Critical: Missing Supabase configuration');
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Axios client with enhanced configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': API_KEY,
    'User-Agent': 'LightSpeedPay-Frontend/1.0',
  },
  withCredentials: false, // For Railway CORS
});

// Enhanced request interceptor
apiClient.interceptors.request.use((config) => {
  const extendedConfig = config as ExtendedAxiosRequestConfig;
  
  // Ensure API key is always present
  if (!extendedConfig.headers['x-api-key']) {
    extendedConfig.headers['x-api-key'] = API_KEY;
  }
  
  // Add timestamp for request tracking
  extendedConfig.metadata = { startTime: Date.now() };
  
  // Try to get token from localStorage or Supabase session
  const token = localStorage.getItem('access_token') || SUPABASE_ANON_KEY;
  if (token && token !== SUPABASE_ANON_KEY) {
    extendedConfig.headers.Authorization = `Bearer ${token}`;
  }
  
  // Enhanced logging
  DEBUG_LOGS && console.log(`🚀 API Request: ${extendedConfig.method?.toUpperCase()} ${extendedConfig.url}`, {
    headers: {
      'x-api-key': extendedConfig.headers['x-api-key'] ? '✅ Set' : '❌ Missing',
      'Authorization': extendedConfig.headers.Authorization ? '✅ Set' : '❌ Missing',
      'Content-Type': extendedConfig.headers['Content-Type']
    },
    baseURL: extendedConfig.baseURL
  });
  
  return extendedConfig;
});

// Enhanced response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    const extendedConfig = response.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (extendedConfig.metadata?.startTime || 0);
    DEBUG_LOGS && console.log(`✅ API Response: ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const extendedConfig = error.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (extendedConfig?.metadata?.startTime || 0);
    const retryCount = extendedConfig?.retryCount || 0;
    
    console.error(`❌ API Error: ${error.config?.url} (${duration}ms)`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      retryCount,
      data: error.response?.data
    });
    
    // Enhanced error categorization
    if (error.response?.status === 404) {
      console.warn(`🔍 Endpoint not found: ${error.config?.url}`);
    } else if (error.response?.status === 401) {
      console.warn(`🔐 Unauthorized: Check API key`);
    } else if (error.response?.status === 403) {
      console.warn(`🚫 Forbidden: Access denied`);
    } else if (error.response?.status >= 500) {
      console.error(`🔥 Server Error: Backend may have issues`);
    } else if (error.code === 'ERR_NETWORK') {
      console.error(`🌐 Network Error: Backend connection failed`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`⏱️ Timeout Error: Request took longer than ${REQUEST_TIMEOUT}ms`);
    }
    
         // Implement retry logic for specific errors
     if (retryCount < RETRY_ATTEMPTS && 
         (error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNABORTED' || 
          (error.response?.status >= 500))) {
       
       extendedConfig.retryCount = retryCount + 1;
       const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
       
       console.log(`🔄 Retrying request (${retryCount + 1}/${RETRY_ATTEMPTS}) after ${delay}ms`);
       
       await new Promise(resolve => setTimeout(resolve, delay));
       return apiClient(extendedConfig);
     }
    
    return Promise.reject(error);
  }
);

// Enhanced connection test with comprehensive diagnostics
export const testBackendConnection = async () => {
  console.log('🔗 Testing backend connection...');
  console.log('📍 Connection Details:', {
    API_BASE_URL,
    API_KEY: API_KEY ? '✅ Set' : '❌ Missing',
    env: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  });
  
  const diagnostics = {
    url: `${API_BASE_URL}/system/status`,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    userAgent: navigator.userAgent,
    online: navigator.onLine
  };
  
  try {
    // Pre-flight checks
    if (!navigator.onLine) {
      throw new Error('Device is offline');
    }
    
    const startTime = Date.now();
    console.log('🎯 Testing URL:', diagnostics.url);
    
    const response = await apiClient.get('/system/status', {
      timeout: 10000,
      headers: {
        'x-api-key': API_KEY,
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Backend connection successful!');
    console.log('📊 Response Details:', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      dataKeys: Object.keys(response.data || {}),
      headers: {
        'content-type': response.headers['content-type'],
        'access-control-allow-origin': response.headers['access-control-allow-origin']
      }
    });
    
    return { 
      success: true, 
      data: response.data,
      status: response.status,
      duration,
      diagnostics,
      message: 'Backend connection successful'
    };
    
  } catch (error: any) {
    const duration = Date.now() - Date.now();
    
    console.warn('⚠️ Backend connection failed');
    console.error('❌ Full Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      duration: `${duration}ms`,
      url: error.config?.url,
      headers: error.config?.headers,
      responseData: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    });
    
    // Enhanced troubleshooting guidance
    let troubleshooting = [];
    
    if (error.code === 'ERR_NETWORK') {
      troubleshooting = [
        '• Backend server may not be running on Railway',
        '• Check Railway deployment logs for startup errors',
        '• Verify CORS configuration allows frontend origin',
        '• Confirm Railway app is not paused/sleeping',
        `• Test direct access: ${API_BASE_URL.replace('/api/v1', '')}/health`
      ];
    } else if (error.response?.status === 401) {
      troubleshooting = [
        '• API key mismatch between frontend and backend',
        `• Frontend API key: ${API_KEY}`,
        '• Check Railway environment variables',
        '• Verify x-api-key header is being sent'
      ];
    } else if (error.response?.status === 404) {
      troubleshooting = [
        '• API endpoint may not exist',
        '• Check backend routing configuration',
        '• Verify API version in URL path'
      ];
    } else if (error.code === 'ECONNABORTED') {
      troubleshooting = [
        `• Request timeout after ${REQUEST_TIMEOUT}ms`,
        '• Backend may be slow to respond',
        '• Consider increasing timeout value',
        '• Check Railway logs for performance issues'
      ];
    }
    
    if (troubleshooting.length > 0) {
      console.error('🔧 Troubleshooting Steps:');
      troubleshooting.forEach(step => console.error(step));
    }
    
    return { 
      success: false, 
      error: error.message || 'Connection failed',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 'NO_RESPONSE',
      diagnostics,
      troubleshooting,
      duration,
      fallback: true 
    };
  }
};

// API service methods with enhanced error handling
export const apiService = {
  // Gateway Management
  async getGateways() {
    try {
      DEBUG_LOGS && console.log('🔍 Fetching gateways from:', API_BASE_URL + '/admin/gateways');
      const response = await apiClient.get('/admin/gateways');
      DEBUG_LOGS && console.log('✅ Gateway API Response:', response.data);
      
      // Backend returns { gateways: [...] }, so extract the gateways array
      const gateways = response.data?.gateways || response.data || [];
      
      // Ensure each gateway has required properties for frontend
      const processedGateways = gateways.map((gateway: any) => ({
        id: gateway.id,
        name: gateway.name || 'Unknown Gateway',
        provider: gateway.provider || gateway.code || 'unknown',
        status: gateway.is_active ? 'active' : 'inactive',
        priority: gateway.priority || 100,
        successRate: gateway.success_rate || 100,
        dailyLimit: gateway.monthly_limit || 1000000,
        currentUsage: 0, // Default value
        responseTime: gateway.response_time_ms || 100,
        fees: gateway.fee_percent || 2.5,
        region: gateway.region || 'IN',
      }));
      
      DEBUG_LOGS && console.log('🎯 Processed Gateways:', processedGateways);
      return processedGateways;
    } catch (error: any) {
      console.error('❌ Error fetching gateways:', error);
      
      // Only use mock data in development or if explicitly enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        console.log('🔄 Using mock data for development');
        return [
          {
            id: '1',
            name: 'Razorpay Gateway',
            provider: 'razorpay',
            status: 'active',
            priority: 1,
            successRate: 99.5,
            dailyLimit: 1000000,
            currentUsage: 150000,
            responseTime: 120,
            fees: 2.5,
            region: 'IN',
          },
          {
            id: '2',
            name: 'PayU Gateway',
            provider: 'payu',
            status: 'active',
            priority: 2,
            successRate: 98.8,
            dailyLimit: 800000,
            currentUsage: 85000,
            responseTime: 180,
            fees: 3.0,
            region: 'IN',
          }
        ];
      }
      
      throw error; // Re-throw error for proper handling by React Query
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
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
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
      throw error;
    }
  },

  // System Status
  async getSystemStatus() {
    try {
      const response = await apiClient.get('/system/status');
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return {
          payment_processing: { status: 'operational', uptime: '99.9%' },
          api_services: { status: 'operational', uptime: '99.8%' },
          database: { status: 'operational', uptime: '99.5%' },
          external_gateways: { status: 'operational', uptime: '99.7%' },
        };
      }
      throw error;
    }
  },

  // Queue Monitoring
  async getQueueStats() {
    try {
      const response = await apiClient.get('/admin/queues');
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return [
          { queue_name: 'transaction-processing', waiting: 5, active: 2, completed: 1250, failed: 3 },
          { queue_name: 'webhook-processing', waiting: 2, active: 1, completed: 800, failed: 1 },
          { queue_name: 'whatsapp-notifications', waiting: 0, active: 0, completed: 150, failed: 0 }
        ];
      }
      throw error;
    }
  },

  // Alerts
  async getAlerts() {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return [];
      }
      throw error;
    }
  },

  // Analytics
  async getAnalytics(params?: any) {
    try {
      const response = await apiClient.get('/analytics', { params });
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return {
          today_volume: 89247000,
          volume_change: '+8.4%',
          success_rate_change: '-0.2%',
          failed_change: '+15%',
          transaction_change: '+12%',
        };
      }
      throw error;
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
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return { data: [], nextCursor: null };
      }
      throw error;
    }
  },

  async updateClient(id: string, updates: any) {
    const response = await apiClient.put(`/admin/clients/${id}`, updates);
    return response.data;
  },

  async createClient(clientData: any) {
    const response = await apiClient.post('/admin/clients', clientData);
    return response.data;
  },

  async getWallets() {
    try {
      const response = await apiClient.get('/wallets');
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return [];
      }
      throw error;
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

// SSE Subscription helpers
export const subscribeToQueueMetrics = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
  const url = `${baseUrl}/functions/v1/queue-stats-stream`;
  
  DEBUG_LOGS && console.log('🔗 Connecting to Queue Metrics SSE:', url);
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'metric') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse Queue Metrics SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('Queue Metrics SSE Error:', error);
  };

  return () => es.close();
};

export const subscribeToGatewayHealth = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
  const url = `${baseUrl}/functions/v1/gateway-health-stream`;
  
  DEBUG_LOGS && console.log('🔗 Connecting to Gateway Health SSE:', url);
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'metric') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse Gateway Health SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('Gateway Health SSE Error:', error);
  };

  return () => es.close();
};

export const subscribeToTransactionStream = (callback: (txn: any) => void) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
  const url = `${baseUrl}/functions/v1/transaction-stream`;
  
  DEBUG_LOGS && console.log('🔗 Connecting to Transaction Stream SSE:', url);
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'transaction') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse Transaction Stream SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('Transaction Stream SSE Error:', error);
  };

  return () => es.close();
};

export const subscribeToAuditLogs = (callback: (log: any) => void) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
  const url = `${baseUrl}/functions/v1/audit-logs-stream`;
  
  DEBUG_LOGS && console.log('🔗 Connecting to Audit Logs SSE:', url);
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'audit_log') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse Audit Logs SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('Audit Logs SSE Error:', error);
  };

  return () => es.close();
};

export const subscribeToSystemStatus = (callback: (status: any) => void) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
  const url = `${baseUrl}/functions/v1/system-status-stream`;
  
  DEBUG_LOGS && console.log('🔗 Connecting to System Status SSE:', url);
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'status') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse System Status SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('System Status SSE Error:', error);
  };

  return () => es.close();
}; 