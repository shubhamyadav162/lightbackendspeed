import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Extend Axios config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number };
  retryCount?: number;
}

// Simple environment configuration
const API_KEY = import.meta.env.VITE_API_KEY || 'admin_test_key';
const DEBUG_LOGS = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '15000');
const RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3');

// Simple API Base URL resolution
const getApiBaseUrl = () => {
  // Optional override to force local backend in dev
  const USE_LOCAL = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';

  if (import.meta.env.DEV && USE_LOCAL) {
    const localUrl = 'http://localhost:3100/api/v1';
    DEBUG_LOGS && console.log('🔧 DEV mode - using *local* backend:', localUrl);
    return localUrl;
  }
  
  // Fallback to shared production backend (works for dev & prod)
  const prodUrl = 'https://web-production-0b337.up.railway.app/api/v1';
  DEBUG_LOGS && console.log('🌐 Using Railway backend:', prodUrl, `(DEV=${import.meta.env.DEV})`);
  return prodUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Simple configuration logging
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  API_KEY: API_KEY ? '✅ Set' : '❌ Missing',
  MODE: import.meta.env.MODE,
  DEBUG_LOGS,
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS
});

// Simple Axios client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': API_KEY,
    'User-Agent': 'LightSpeedPay-Frontend/1.0',
  },
  withCredentials: false,
});

// Simple request interceptor
apiClient.interceptors.request.use(async (config) => {
  const extendedConfig = config as ExtendedAxiosRequestConfig;
  
  // Set default headers
  if (!extendedConfig.headers) {
    extendedConfig.headers = new AxiosHeaders();
  }
  
  // Always add API key
  extendedConfig.headers['x-api-key'] = API_KEY;
  
  // Add timestamp for request tracking
  extendedConfig.metadata = { startTime: Date.now() };
  
  // Simple logging
  DEBUG_LOGS && console.log(`🚀 API Request: ${extendedConfig.method?.toUpperCase()} ${extendedConfig.url}`, {
    headers: {
      'x-api-key': extendedConfig.headers['x-api-key'] ? '✅ Set' : '❌ Missing',
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

// Enhanced connection test
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
    const response = await apiClient.get('/system/status');
    const duration = Date.now() - startTime;
    
    console.log('✅ Backend connection successful', {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data
    });
    
    return {
      success: true,
      status: response.status,
      duration,
      data: response.data,
      diagnostics
    };
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error);
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      diagnostics
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
        // Include additional fields for custom providers
        api_key: gateway.api_key,
        api_secret: gateway.api_secret,
        client_id: gateway.client_id,
        api_id: gateway.api_id,
        monthly_limit: gateway.monthly_limit,
        is_active: gateway.is_active,
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
    try {
      console.log('🚀 Creating Gateway with payload:', gateway);
      
      // Prepare credentials object based on provider type
      let credentials: any = {};
      
      if (gateway.provider === 'custom') {
        credentials = {
          client_id: gateway.client_id,
          api_id: gateway.api_id,
          api_secret: gateway.api_secret,
        };
      } else {
        credentials = {
          api_key: gateway.api_key,
          api_secret: gateway.api_secret,
        };
      }

      // Normalize the payload for the backend - match expected format
      const normalizedPayload = {
        name: gateway.name,
        provider: gateway.provider,
        credentials: credentials, // Backend expects credentials object
        priority: gateway.priority || 1,
        monthly_limit: gateway.monthly_limit || 1000000,
        is_active: gateway.is_active !== undefined ? gateway.is_active : true,
      };

      console.log('🎯 Normalized payload:', normalizedPayload);
      console.log('🔑 API Key being sent:', API_KEY);
      console.log('🌐 Request URL:', `${API_BASE_URL}/admin/gateways`);
      
      const response = await apiClient.post('/admin/gateways', normalizedPayload);
      console.log('✅ Gateway created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Gateway creation failed:', error);
      console.error('📋 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        responseText: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      
      // भी specific error message दिखाएं
      if (error.response?.data?.error) {
        console.error('🔴 Backend Error Message:', error.response.data.error);
      }
      if (error.response?.data?.details) {
        console.error('🔍 Backend Error Details:', error.response.data.details);
      }
      
      throw error;
    }
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
    try {
      const response = await apiClient.get('/admin/queues/stats');
      const data = response.data;
      
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.queues)) {
        return data.queues;
      } else if (data && Array.isArray(data.stats)) {
        return data.stats;
      } else {
        console.warn('Queue stats response is not an array:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        return [
          { name: 'transaction-processing', waiting: 5, active: 2, completed: 1250, failed: 3 },
          { name: 'webhook-processing', waiting: 2, active: 1, completed: 800, failed: 1 },
          { name: 'whatsapp-notifications', waiting: 0, active: 0, completed: 150, failed: 0 }
        ];
      }
      
      // Return empty array on error to prevent crashes
      return [];
    }
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

  // Utility function to add the custom gateway
  async addCustomGateway() {
    try {
      console.log('🚀 Adding NextGen Techno Ventures Custom Gateway...');
      
      const customGateway = {
        name: 'NextGen Techno Ventures',
        provider: 'custom',
        client_id: '682aefe4e352d264171612c0',
        api_id: 'FRQT0XKLHY',
        api_secret: 'S84LOJ3U0N',
        priority: 1,
        monthly_limit: 10000000,
        is_active: true,
      };

      const result = await this.createGateway(customGateway);
      console.log('✅ Custom Gateway added successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to add custom gateway:', error);
      
      // Check if gateway already exists
      if (error.response?.status === 409 || 
          error.response?.data?.error?.includes('already exists') ||
          error.response?.data?.error?.includes('duplicate')) {
        console.warn('⚠️ Gateway already exists, skipping...');
        return { message: 'Gateway already exists' };
      }
      
      throw error;
    }
  },
};

// Simple real-time subscriptions using SSE (no authentication required)
export const subscribeToTransactions = (callback: (payload: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/transaction-stream`;
  
  console.log('🔗 Connecting to Transaction Stream SSE:', url);
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

export const subscribeToAlerts = (callback: (payload: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/alerts-stream`;
  
  console.log('🔗 Connecting to Alerts Stream SSE:', url);
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'alert') {
        callback(parsed.data);
      }
    } catch (err) {
      console.error('Failed to parse Alerts Stream SSE payload', err);
    }
  };

  es.onerror = (error) => {
    console.error('Alerts Stream SSE Error:', error);
  };

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

// SSE Subscription helpers
export const subscribeToQueueMetrics = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

export const subscribeToGatewayHealth = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

export const subscribeToTransactionStream = (callback: (txn: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

export const subscribeToAuditLogs = (callback: (log: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
};

export const subscribeToSystemStatus = (callback: (status: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
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

  return {
    unsubscribe: () => {
      es.close();
    }
  };
}; 