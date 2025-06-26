import React, { useEffect, useState } from 'react';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { testBackendConnection } from './services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionResult(null);
    
    try {
      const result = await testBackendConnection();
      setConnectionResult(result);
      setConnectionStatus(result.success ? 'success' : 'failed');
      
      // Show details if connection failed for debugging
      if (!result.success) {
        setShowDetails(true);
      }
    } catch (error) {
      setConnectionResult({ success: false, error: 'Test failed unexpectedly' });
      setConnectionStatus('failed');
      setShowDetails(true);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'testing':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return `✅ Connected (${connectionResult?.duration}ms)`;
      case 'failed':
        return '❌ Connection Failed';
      case 'testing':
        return '⏳ Testing...';
      default:
        return '⚪ Not Tested';
    }
  };

  useEffect(() => {
    // Auto-test connection on app start with delay for better UX
    const timer = setTimeout(() => {
      handleTestConnection();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          {/* Enhanced Backend Connection Test Panel */}
          <div className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-200 ${getStatusColor()} border rounded-lg shadow-lg`}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-semibold text-sm">Backend Status</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors"
                    title="Toggle details"
                  >
                    {showDetails ? 'Hide' : 'Details'}
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-xs p-1 rounded hover:bg-black/10 transition-colors"
                    title="Minimize panel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm mb-2">
                {getStatusText()}
              </div>
              
              <button 
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              
              {/* Enhanced Details Section */}
              {showDetails && connectionResult && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>URL:</strong> 
                      <span className="ml-1 font-mono break-all">
                        {connectionResult.diagnostics?.url || 'N/A'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>Status:</strong> 
                      <span className="ml-1">
                        {connectionResult.status || 'Unknown'}
                      </span>
                    </div>
                    
                    {connectionResult.duration && (
                      <div>
                        <strong>Response Time:</strong> 
                        <span className="ml-1">{connectionResult.duration}ms</span>
                      </div>
                    )}
                    
                    {connectionResult.success && connectionResult.data && (
                      <div>
                        <strong>Data Keys:</strong> 
                        <span className="ml-1">
                          {Object.keys(connectionResult.data).join(', ') || 'None'}
                        </span>
                      </div>
                    )}
                    
                    {!connectionResult.success && connectionResult.error && (
                      <div>
                        <strong>Error:</strong> 
                        <span className="ml-1 text-red-600">
                          {connectionResult.error}
                        </span>
                      </div>
                    )}
                    
                    {!connectionResult.success && connectionResult.code && (
                      <div>
                        <strong>Code:</strong> 
                        <span className="ml-1 font-mono">
                          {connectionResult.code}
                        </span>
                      </div>
                    )}
                    
                    {/* Troubleshooting Tips */}
                    {!connectionResult.success && connectionResult.troubleshooting && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <strong className="text-red-600">Troubleshooting:</strong>
                        <ul className="mt-1 space-y-1 list-disc list-inside">
                          {connectionResult.troubleshooting.slice(0, 3).map((tip: string, index: number) => (
                            <li key={index} className="text-red-600">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-current/20">
                      <strong>Environment:</strong> 
                      <span className="ml-1 capitalize">
                        {connectionResult.diagnostics?.environment || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Main app content */}
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          
          <Toaster position="top-right" richColors />
        </Router>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
