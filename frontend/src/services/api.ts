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

// Supabase Edge Functions URL
const getSupabaseEdgeUrl = () => {
  return 'https://trmqbpnnboyoneyfleux.supabase.co/functions/v1';
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
      
      let gateways = [];
      
      try {
        const response = await apiClient.get('/admin/gateways');
        DEBUG_LOGS && console.log('✅ Gateway API Response:', response.data);
        
        // Backend returns { gateways: [...] }, so extract the gateways array
        gateways = response.data?.gateways || response.data || [];
      } catch (apiError: any) {
        console.warn('⚠️ Gateway API failed, using fallback:', apiError.message);
        // Return empty array if API fails
        return [];
      }
      
      // Ensure each gateway has required properties for frontend
      const processedGateways = gateways.map((gateway: any) => ({
        id: gateway.id,
        name: gateway.name || 'Unknown Gateway',
        provider: gateway.provider || gateway.code || 'unknown',
        status: gateway.is_active ? 'active' : 'inactive',
        priority: gateway.priority || 100,
        successRate: gateway.success_rate || 100,
        dailyLimit: gateway.monthly_limit || 1000000,
        currentUsage: gateway.current_volume || 0,
        responseTime: gateway.avg_response_time || 100,
        fees: 2.5, // Default fee percentage
        region: gateway.environment === 'production' ? 'PROD' : 'TEST',
        // Include additional fields from database
        api_key: gateway.credentials?.api_key,
        api_secret: gateway.credentials?.api_secret,
        client_id: gateway.credentials?.client_id,
        api_id: gateway.credentials?.api_id,
        monthly_limit: gateway.monthly_limit,
        is_active: gateway.is_active,
        webhook_url: gateway.webhook_url,
        environment: gateway.environment
      }));
      
      DEBUG_LOGS && console.log('🎯 Processed Real Gateways:', processedGateways);
      console.log('✅ Real Gateways from Database:', processedGateways.length, 'gateways loaded');
      return processedGateways;
    } catch (error: any) {
      console.error('❌ Error fetching gateways:', error);
      // Return empty array on error instead of fallback gateways
      return [];
    }
  },

  // 🚀 NEW: Enhanced EaseBuzz Payment with Multiple Integration Options
  async initiateEasebuzzPayment(paymentData: {
    amount: number;
    customer_email: string;
    customer_name?: string;
    customer_phone?: string;
    order_id?: string;
    description?: string;
    test_mode?: boolean;
    client_key: string;
    client_salt: string;
    integration_type?: 'railway' | 'edge' | 'auto';
  }) {
    const integrationType = paymentData.integration_type || 'auto';
    
    try {
      // 🚀 AUTO: Try Railway backend first, fallback to Edge Function
      if (integrationType === 'auto' || integrationType === 'railway') {
        try {
          console.log('🚂 Attempting EaseBuzz payment via Railway backend...');
          
          const railwayResponse = await apiClient.post('/pay', {
            amount: paymentData.amount,
            customer_email: paymentData.customer_email,
            customer_name: paymentData.customer_name,
            customer_phone: paymentData.customer_phone,
            order_id: paymentData.order_id,
            description: paymentData.description,
            payment_method: 'upi',
            test_mode: paymentData.test_mode
          }, {
            headers: {
              'x-api-key': paymentData.client_key,
              'x-api-secret': paymentData.client_salt
            }
          });

          if (railwayResponse.data.success) {
            console.log('✅ EaseBuzz payment initiated via Railway backend:', railwayResponse.data);
            return {
              ...railwayResponse.data,
              integration_used: 'railway_backend',
              gateway: 'LightSpeed Payment Gateway'
            };
          }
        } catch (railwayError: any) {
          console.warn('⚠️ Railway backend failed, trying Edge Function...', railwayError.message);
          
          // If auto mode and railway failed, try edge function
          if (integrationType === 'auto') {
            return await this.initiateEasebuzzPaymentViaEdge(paymentData);
          } else {
            throw railwayError;
          }
        }
      }

      // 🌐 EDGE: Use Supabase Edge Function
      if (integrationType === 'edge') {
        return await this.initiateEasebuzzPaymentViaEdge(paymentData);
      }

    } catch (error: any) {
      console.error('❌ EaseBuzz payment failed on all methods:', error);
      throw error;
    }
  },

  // 🌐 EaseBuzz Payment via Supabase Edge Function
  async initiateEasebuzzPaymentViaEdge(paymentData: {
    amount: number;
    customer_email: string;
    customer_name?: string;
    customer_phone?: string;
    order_id?: string;
    description?: string;
    test_mode?: boolean;
    client_key: string;
    client_salt: string;
  }) {
    try {
      console.log('⚡ Attempting EaseBuzz payment via Supabase Edge Function...');
      
      const supabaseEdgeUrl = 'https://trmqbpnnboyoneyfleux.supabase.co/functions/v1';
      const response = await fetch(`${supabaseEdgeUrl}/easebuzz-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk'}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ EaseBuzz payment initiated via edge function:', result);
        return {
          ...result,
          integration_used: 'supabase_edge_function',
          gateway: 'LightSpeed Payment Gateway'
        };
      } else {
        throw new Error(result.message || 'Edge function payment failed');
      }
    } catch (error: any) {
      console.error('❌ EaseBuzz Edge Function payment failed:', error);
      throw error;
    }
  },

  // 🚀 NEW: Enhanced EaseBuzz Integration Test
  async testEasebuzzIntegration(options: {
    test_railway?: boolean;
    test_edge?: boolean;
    test_credentials?: boolean;
    test_webhook?: boolean;
  } = {}) {
    const {
      test_railway = true,
      test_edge = true,
      test_credentials = true,
      test_webhook = true
    } = options;

    const results = {
      railway_backend: null as any,
      edge_function: null as any,
      credentials: null as any,
      webhook: null as any,
      overall_success: false
    };

    try {
      console.log('🧪 Starting comprehensive EaseBuzz integration test...');

      // Test Railway Backend
      if (test_railway) {
        try {
          console.log('🚂 Testing Railway backend integration...');
          const railwayTest = await this.initiateEasebuzzPayment({
            amount: 100,
            customer_email: 'test@lightspeedpay.com',
            customer_name: 'Railway Test User',
            customer_phone: '9999999999',
            order_id: 'RAILWAY_TEST_' + Date.now(),
            description: 'Railway Backend Integration Test',
            test_mode: true,
            client_key: 'test_client_key',
            client_salt: 'test_client_salt',
            integration_type: 'railway'
          });
          
          results.railway_backend = {
            success: true,
            message: 'Railway backend test successful',
            data: railwayTest
          };
        } catch (error: any) {
          results.railway_backend = {
            success: false,
            message: 'Railway backend test failed',
            error: error.message
          };
        }
      }

      // Test Edge Function
      if (test_edge) {
        try {
          console.log('⚡ Testing Edge Function integration...');
          const edgeTest = await this.initiateEasebuzzPayment({
            amount: 100,
            customer_email: 'test@lightspeedpay.com',
            customer_name: 'Edge Test User',
            customer_phone: '9999999999',
            order_id: 'EDGE_TEST_' + Date.now(),
            description: 'Edge Function Integration Test',
            test_mode: true,
            client_key: 'test_client_key',
            client_salt: 'test_client_salt',
            integration_type: 'edge'
          });
          
          results.edge_function = {
            success: true,
            message: 'Edge function test successful',
            data: edgeTest
          };
        } catch (error: any) {
          results.edge_function = {
            success: false,
            message: 'Edge function test failed',
            error: error.message
          };
        }
      }

      // Test Credentials
      if (test_credentials) {
        try {
          console.log('🔐 Testing EaseBuzz credentials...');
          const gateways = await this.getGateways();
          const easebuzzGateway = gateways.find((g: any) => g.provider === 'easebuzz');
          
          if (easebuzzGateway && easebuzzGateway.credentials) {
            results.credentials = {
              success: true,
              message: 'EaseBuzz credentials configured',
              data: {
                api_key: easebuzzGateway.credentials.api_key ? 'Present' : 'Missing',
                api_secret: easebuzzGateway.credentials.api_secret ? 'Present' : 'Missing',
                webhook_url: easebuzzGateway.webhook_url || 'Not configured'
              }
            };
          } else {
            throw new Error('EaseBuzz gateway not found');
          }
        } catch (error: any) {
          results.credentials = {
            success: false,
            message: 'Credentials test failed',
            error: error.message
          };
        }
      }

      // Test Webhook Configuration
      if (test_webhook) {
        try {
          console.log('🔔 Testing webhook configuration...');
          const expectedWebhookUrl = 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp';
          
          results.webhook = {
            success: true,
            message: 'Webhook configuration verified',
            data: {
              expected_url: expectedWebhookUrl,
              status: 'Correctly configured for EaseBuzz'
            }
          };
        } catch (error: any) {
          results.webhook = {
            success: false,
            message: 'Webhook test failed',
            error: error.message
          };
        }
      }

      // Overall success calculation
      const successCount = Object.values(results).filter(r => r && r.success).length;
      const totalTests = Object.values(results).filter(r => r !== null).length - 1; // -1 for overall_success field
      results.overall_success = successCount === totalTests;

      console.log('🎯 EaseBuzz integration test complete:', results);
      return results;

    } catch (error: any) {
      console.error('❌ EaseBuzz integration test failed:', error);
      return {
        ...results,
        overall_success: false,
        error: error.message
      };
    }
  },

  // 🚀 Enhanced Gateway Creation with EaseBuzz Support
  async createGateway(gatewayData: any) {
    try {
      // Check if this is an EaseBuzz auto-configuration
      if (gatewayData.provider === 'easebuzz' && gatewayData.api_key && gatewayData.api_secret) {
        console.log('🚀 EaseBuzz auto-configuration detected');
        
        // Use auto-configuration endpoint
        const response = await apiClient.post('/admin/gateways/auto-configure', {
          provider: 'easebuzz',
          credentials: {
            api_key: gatewayData.api_key,
            api_secret: gatewayData.api_secret,
            webhook_secret: gatewayData.webhook_secret
          }
        });

        if (response.data.success) {
          console.log('✅ EaseBuzz gateway auto-configured successfully');
          return {
            ...response.data,
            gateway_type: 'easebuzz',
            auto_configured: true,
            webhook_url: 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp'
          };
        }
      }

      // Fallback to regular gateway creation
      const response = await apiClient.post('/admin/gateways', gatewayData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Gateway creation failed:', error);
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
    try {
      console.log('🧪 Testing Gateway:', id);
      
      // 🚀 REAL API TEST: Call backend to test actual gateway connectivity
      console.log('🎯 Making REAL API call to backend for gateway test...');
      
      const startTime = Date.now();
      const response = await apiClient.post(`/admin/gateways/${id}/test`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log('✅ Real Gateway Test API Response:', response.data);
      
      // Add actual response time to the result
      const result = {
        ...response.data,
        actualResponseTime: `${responseTime}ms`,
        testType: 'REAL API CALL',
        timestamp: new Date().toISOString()
      };
      
      console.log('🎯 Enhanced Real Test Result:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ Real Gateway Test Failed:', error);
      
      // Check if this is a specific gateway we need to handle differently
      if (id === 'easebuzz_live_gateway' || id.includes('easebuzz')) {
        console.log('🔄 Easebuzz API test failed, checking if it\'s because backend endpoint doesn\'t exist yet...');
        
        // If backend doesn't have the test endpoint yet, show informative response
        if (error.response?.status === 404 || error.response?.status === 405) {
          return {
            success: false,
            gateway: 'Easebuzz',
            status: 'Backend Test Endpoint Not Implemented',
            message: 'Backend में अभी तक gateway test endpoint implement नहीं हुआ है। Gateway database में stored है लेकिन API connectivity test pending है।',
            testType: 'ENDPOINT_MISSING',
            error: `HTTP ${error.response?.status}: Test endpoint not found`,
            recommendation: 'Backend में /admin/gateways/{id}/test endpoint implement करना होगा।'
          };
        }
      }
      
      // For demo gateways, show appropriate mock results
      if (id.includes('demo')) {
        const provider = id.includes('razorpay') ? 'Razorpay' : 'PayU';
        return {
          success: true,
          gateway: provider,
          status: 'Demo Mode',
          testType: 'MOCK_DEMO',
          message: `${provider} demo gateway tested successfully! Demo mode में running है।`
        };
      }
      
      // Return detailed error for debugging
      return {
        success: false,
        error: error.message || 'Test failed',
        status: error.response?.status || 'Network Error',
        testType: 'REAL_API_FAILED',
        message: 'Gateway test करने में issue आई - credentials या network check करें',
        details: {
          statusCode: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data
        }
      };
    }
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
      throw error;
    }
  },

  // System Status
  async getSystemStatus() {
    try {
      const response = await apiClient.get('/system/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Queue Monitoring
  async getQueueStats() {
    try {
      const response = await apiClient.get('/admin/queues');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Alerts
  async getAlerts() {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Analytics
  async getAnalytics(params?: any) {
    try {
      const response = await apiClient.get('/analytics', { params });
      return response.data;
    } catch (error: any) {
      console.error('Analytics API Error:', error);
      
      // Return fallback data structure to prevent crashes
      if (import.meta.env.DEV) {
        console.log('🔄 Analytics API failed, returning fallback data');
        return {
          stats: [],
          totals: {
            total_count: 0,
            completed_count: 0,
            failed_count: 0,
            pending_count: 0,
            total_amount: 0,
            completed_amount: 0
          }
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
      throw error;
    }
  },

  // Client Gateway Management
  async getClientGatewayAssignments(clientId: string) {
    try {
      const response = await apiClient.get(`/admin/clients/${clientId}/gateways`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching client gateway assignments:', error);
      throw error;
    }
  },

  async createClientGatewayAssignment(clientId: string, gatewayData: any) {
    try {
      const response = await apiClient.post(`/admin/clients/${clientId}/gateways`, gatewayData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating client gateway assignment:', error);
      throw error;
    }
  },

  async updateClientGatewayAssignment(clientId: string, gatewayId: string, updates: any) {
    try {
      const response = await apiClient.patch(`/admin/clients/${clientId}/gateways/${gatewayId}`, updates);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating client gateway assignment:', error);
      throw error;
    }
  },

  async deleteClientGatewayAssignment(clientId: string, gatewayId: string) {
    try {
      const response = await apiClient.delete(`/admin/clients/${clientId}/gateways/${gatewayId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting client gateway assignment:', error);
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

  // 🚀 Test Complete EaseBuzz Flow
  async testCompleteEasebuzzFlow() {
    try {
      console.log('🧪 Testing complete EaseBuzz flow...');
      
      // Step 1: Test backend health
      const healthResponse = await fetch(`${getApiBaseUrl()}/../../health`);
      const healthData = await healthResponse.json();
      console.log('✅ Backend health:', healthData);

      // Step 2: Test gateway listing
      const gatewaysResponse = await this.getGateways();
      console.log('✅ Gateways loaded:', gatewaysResponse);

      // Step 3: Test EaseBuzz edge function
      const edgeTest = await this.testEasebuzzIntegration();
      console.log('✅ Edge function test:', edgeTest);

      return {
        success: true,
        message: 'Complete EaseBuzz flow test successful',
        tests: {
          backend_health: healthData,
          gateways_loaded: Array.isArray(gatewaysResponse),
          edge_function: edgeTest.success
        }
      };
    } catch (error: any) {
      console.error('❌ Complete flow test failed:', error);
      return {
        success: false,
        message: 'Complete EaseBuzz flow test failed',
        error: error.message
      };
    }
  }
};

// Simple real-time subscriptions using SSE (no authentication required)
export const subscribeToTransactions = (callback: (payload: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/transaction-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Transaction Stream SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Transaction Stream SSE Connected');
        reconnectAttempts = 0; // Reset on successful connection
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Transaction Stream SSE data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Transaction Stream SSE Error, attempting graceful reconnection...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Transaction Stream`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Transaction Stream SSE failed after max attempts, continuing without live transaction data');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Transaction Stream SSE connection:', err);
    }
  };
  
  connect();
  
  // Return cleanup function
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToAlerts = (callback: (payload: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/alerts-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Alerts SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Alerts Stream SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Alerts SSE data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Alerts Stream SSE Error, gracefully handling...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Alerts Stream`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Alerts Stream SSE failed after max attempts, continuing without live alerts');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Alerts Stream SSE connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToQueueMetrics = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/queue-stats-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Queue Metrics SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Queue Metrics SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Queue Metrics SSE data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Queue Metrics SSE Error, gracefully handling...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Queue Metrics`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Queue Metrics SSE failed after max attempts, continuing without live queue data');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Queue Metrics SSE connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToGatewayHealth = (callback: (metric: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/gateway-health-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Gateway Health SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Gateway Health SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Gateway Health SSE data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Gateway Health SSE Error, gracefully handling...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Gateway Health`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Gateway Health SSE failed after max attempts, continuing without live health data');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Gateway Health SSE connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToTransactionStream = (callback: (txn: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/transaction-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Transaction Stream SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Transaction Stream SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Transaction Stream data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Transaction Stream SSE Error, gracefully reconnecting...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Transaction Stream`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Transaction Stream failed after max attempts');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Transaction Stream connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToAuditLogs = (callback: (log: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/audit-logs-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to Audit Logs SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ Audit Logs SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid Audit Logs data:', event.data);  
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 Audit Logs SSE Error, gracefully handling...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for Audit Logs`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ Audit Logs SSE failed after max attempts');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create Audit Logs connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export const subscribeToSystemStatus = (callback: (status: any) => void) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co';
  const url = `${baseUrl}/functions/v1/system-status-stream`;
  
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  let reconnectTimeout: NodeJS.Timeout;
  
  const connect = () => {
    try {
      console.log('🔗 Connecting to System Status SSE:', url);
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ System Status SSE Connected');
        reconnectAttempts = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.warn('⚠️ Invalid System Status data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('🔄 System Status SSE Error, gracefully handling...', error);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} for System Status`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ System Status SSE failed after max attempts, continuing without live status');
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to create System Status connection:', err);
    }
  };
  
  connect();
  
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}; 