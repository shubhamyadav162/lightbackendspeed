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
import { X } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true); // Default to true
  const [showConnectionWarning, setShowConnectionWarning] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      console.log('🔍 Checking backend connection...');
      const result = await testBackendConnection();
      console.log('✅ Connection result:', result);
      
      if (result.success) {
        setIsConnected(true);
        setShowConnectionWarning(false);
      } else {
        setIsConnected(false);
        setShowConnectionWarning(true);
      }
    } catch (error) {
      console.warn('⚠️ Backend connection check failed:', error);
      setIsConnected(false);
      setShowConnectionWarning(true);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          {/* Show connection warning at the top if backend is not connected */}
          {!isConnected && showConnectionWarning && (
            <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-orange-200 bg-orange-50">
              <AlertDescription className="flex items-center justify-between py-2 px-4">
                <span className="text-orange-800 text-sm">
                  ⚠️ Backend connection failed. Dashboard चल रहा है offline mode में mock data के साथ।
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={checkConnection}
                    className="text-orange-600 hover:text-orange-800 text-sm underline"
                    disabled={isCheckingConnection}
                  >
                    {isCheckingConnection ? 'Checking...' : 'Retry'}
                  </button>
                  <button
                    onClick={() => setShowConnectionWarning(false)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Main app content - always render */}
          <div className={showConnectionWarning && !isConnected ? 'pt-12' : ''}>
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
