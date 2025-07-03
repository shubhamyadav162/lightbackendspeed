import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Settings, Zap, DollarSign, Globe, Shield, Plus, CreditCard } from 'lucide-react';
import { apiService } from '@/services/api';
import { useGateways, useUpdateGateway } from '@/hooks/useApi';
import { subscribeToGatewayHealth } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddGatewayModal } from './AddGatewayModal';
import { GatewayConfigurationModal } from './GatewayConfigurationModal';
import { DraggableGatewayList } from './DraggableGatewayList';
import { EasebuzzQuickSetup } from './EasebuzzQuickSetup';
import { toast } from 'sonner';
import Link from 'next/link';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  priority: number;
  successRate: number;
  dailyLimit: number;
  currentUsage: number;
  responseTime: number;
  fees: number;
  region: string;
  api_key?: string;
  api_secret?: string;
  monthly_limit?: number;
  is_active?: boolean;
  client_id?: string;
  client_secret?: string;
  webhook_url?: string;
  success_url?: string;
  failed_url?: string;
  environment?: string;
}

export const GatewayManagement = () => {
  // Use React Query data directly - no local state copy needed
  const { data: apiGateways = [], isLoading, refetch, error } = useGateways();
  const updateGatewayMutation = useUpdateGateway();
  
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configGateway, setConfigGateway] = useState<Gateway | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [showPayUModal, setShowPayUModal] = useState(false);

  // Debug logging - for troubleshooting
  useEffect(() => {
    console.log('🔍 Gateway Management Debug:', {
      isLoading,
      error: error?.message,
      apiGateways: apiGateways,
      apiGatewaysCount: apiGateways.length,
      apiGatewaysTypes: apiGateways.map(g => g.provider)
    });
  }, [apiGateways, isLoading, error]);

  // Memoize processed gateways
  const gateways = useMemo(() => {
    const processed = apiGateways.map(gateway => ({
      ...gateway,
      ...healthMetrics[gateway.id] // Apply health metrics if available
    }));
    
    // Debug: Check if Easebuzz is found
    const easebuzzFound = processed.find(g => g.provider === 'easebuzz');
    console.log('🔍 Easebuzz Gateway Debug:', {
      totalGateways: processed.length,
      providers: processed.map(g => g.provider),
      easebuzzFound: easebuzzFound ? 'FOUND' : 'NOT FOUND',
      easebuzzDetails: easebuzzFound
    });
    
    return processed;
  }, [apiGateways, healthMetrics]);

  // Check if Easebuzz gateway exists
  const easebuzzGateway = useMemo(() => {
    // Enhanced search: look for both NGME and NextGen patterns
    const found = gateways.find(g => 
      g.provider === 'easebuzz' || 
      g.name?.toLowerCase().includes('ngme') ||
      g.name?.toLowerCase().includes('nextgen') ||
      g.name?.toLowerCase().includes('easebuzz')
    );
    
    console.log('🎯 Final Easebuzz Check (Enhanced):', {
      found: found ? 'YES' : 'NO',
      totalGateways: gateways.length,
      allProviders: gateways.map(g => ({ name: g.name, provider: g.provider })),
      searchResult: found ? {
        id: found.id,
        name: found.name,
        provider: found.provider
      } : null
    });
    return found;
  }, [gateways]);

  // Auto-add PayU gateway on component mount
  useEffect(() => {
    const autoAddPayU = async () => {
      // Check if PayU gateway already exists
      const payuExists = gateways.find(g => 
        g.provider === 'payu' && 
        (g.name?.includes('PayU Money Production') || g.name?.includes('PayU'))
      );
      
      if (!payuExists && gateways.length > 0) {
        console.log('🚀 Auto-adding PayU gateway...');
        
        try {
          const payuData = {
            name: 'PayU Money Production',
            provider: 'payu',
            credentials: {
              api_key: 'xKLUxQ',
              api_secret: 'OhIeWQdMjtR4K7w1alV6c2emB6RnKXWA',
              client_id: 'caf72985a7761ab9938a202da34bfd79fc91eae257a9c400de08670f690aa41b',
              client_secret: '5055b162f2ebe71fb814e5cf36ebbf4d32f0b5c7e6bfd3f70da415bbe1a993ff',
              provider: 'payu'
            },
            environment: 'production',
            webhook_url: 'https://api.lightspeedpay.in/api/v1/callback/payu',
            success_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/success',
            failed_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/failed',
            priority: 2,
            is_active: true
          };
          
          await apiService.createGateway(payuData);
          
          toast.success('✅ PayU Gateway Automatically Added!', {
            description: 'PayU Money credentials को automatically configure कर दिया गया है',
            duration: 5000
          });
          
          // Refetch gateways after adding
          refetch();
          
        } catch (error) {
          console.error('Failed to auto-add PayU gateway:', error);
        }
      }
    };
    
    // Only run when gateways are loaded
    if (!isLoading && gateways.length >= 0) {
      autoAddPayU();
    }
  }, [gateways, isLoading, refetch]); // Include refetch in dependencies

  // Subscribe to real-time health metrics - only once
  useEffect(() => {
    const subscription = subscribeToGatewayHealth((metric) => {
      setHealthMetrics(prev => ({
        ...prev,
        [metric.gateway_id]: {
          responseTime: metric.response_time_ms,
          status: metric.is_available ? 'active' : 'inactive',
        }
      }));
    });
    
    return () => {
      try {
        // subscription is a cleanup function returned by subscribeToGatewayHealth
        subscription?.();
      } catch (error) {
        console.warn('Error cleaning up gateway health subscription:', error);
      }
    };
  }, []);

  // Toggle gateway status - optimistic update
  const toggleGatewayStatus = useCallback(async (id: string) => {
    const gateway = gateways.find(g => g.id === id);
    if (!gateway) return;

    const newStatus = gateway.status === 'active' ? 'inactive' : 'active';
    
    try {
      await updateGatewayMutation.mutateAsync({ 
        id, 
        updates: { status: newStatus } 
      });
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  }, [gateways, updateGatewayMutation]);

  // Update priority - optimistic update
  const updatePriority = useCallback(async (id: string, priority: number) => {
    try {
      await updateGatewayMutation.mutateAsync({ 
        id, 
        updates: { priority } 
      });
    } catch (e) {
      console.error('Failed to update priority:', e);
    }
  }, [updateGatewayMutation]);

  const testConnection = useCallback(async (id: string) => {
    try {
      console.log('🧪 Testing gateway:', id);
      const gateway = gateways.find(g => g.id === id);
      const gatewayName = gateway?.name || 'Unknown Gateway';
      
      // Show loading toast
      toast.info(`${gatewayName} test हो रहा है...`, { duration: 2000 });
      
      const result = await apiService.testGateway(id);
      
      if (result.success) {
        // Success toast with detailed info
        toast.success(`✅ ${result.gateway || gatewayName} Test Successful!`, {
          description: result.message || 'Gateway working perfectly',
          duration: 5000
        });
        
        // For Easebuzz, show additional details
        if (result.details) {
          console.log('🎯 Gateway Test Details:', result.details);
          setTimeout(() => {
            toast.info(`🔍 Test Details: ${result.responseTime || 'N/A'} response time`, {
              description: `Webhook: ${result.webhook ? '✅ Ready' : '❌ Not configured'}`,
              duration: 4000
            });
          }, 1000);
        }
      } else {
        // Error toast
        toast.error(`❌ ${gatewayName} Test Failed`, {
          description: result.message || result.error || 'Unknown error occurred',
          duration: 5000
        });
      }
    } catch (e: any) {
      console.error('Gateway test error:', e);
      toast.error('Gateway Test Failed', {
        description: 'Network error या server issue हो सकता है',
        duration: 5000
      });
    }
  }, [gateways]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Remove the direct refetch calls to prevent infinite loop
  const handleAddGatewaySuccess = useCallback(() => {
    console.log('✅ Gateway added successfully - data will auto-refresh');
    refetch();
  }, [refetch]);

  const handleConfigGatewaySuccess = useCallback(() => {
    console.log('✅ Gateway configured successfully - data will auto-refresh');
    refetch();
  }, [refetch]);

  const openConfigModal = useCallback((gateway: Gateway) => {
    setConfigGateway(gateway);
    setIsConfigModalOpen(true);
  }, []);

  // Add this temporary API test function
  const testRealBackendAPI = async () => {
    console.log('🧪 Testing Real Backend API Connection...');
    
    try {
      const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/admin/gateways', {
        method: 'GET',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real Backend API Success!', data);
        toast.success('🎉 Real Backend API Working! Check console for details.');
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        toast.error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.error('❌ Network/Connection Error:', error);
      toast.error(`Connection Error: ${error.message}`);
    }
  };

  // 🔍 COMPREHENSIVE DIAGNOSTIC FUNCTION
  const runCompleteDiagnostic = async () => {
    console.log('🔍 === COMPLETE DIAGNOSTIC START ===');
    
    const diagnostic: any = {
      timestamp: new Date().toISOString(),
      frontend: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        online: navigator.onLine
      },
      api: {
        baseUrl: import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app',
        key: import.meta.env.VITE_API_KEY || 'admin_test_key'
      },
      reactQuery: {
        isLoading,
        error: error?.message,
        apiGatewaysCount: apiGateways.length,
        providers: apiGateways.map(g => g.provider)
      },
      easebuzz: {
        found: !!easebuzzGateway,
        details: easebuzzGateway
      }
    };
    
    console.log('🔍 Complete Diagnostic Report:', diagnostic);
    
    // Test direct API call
    try {
      console.log('🔍 Testing Direct API Call...');
      const directResponse = await fetch('https://web-production-0b337.up.railway.app/api/v1/admin/gateways', {
        method: 'GET',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json'
        }
      });
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        diagnostic.directApiTest = {
          success: true,
          status: directResponse.status,
          data: directData,
          easebuzzInDirect: directData?.gateways?.find((g: any) => g.provider === 'easebuzz') || null
        };
        
        console.log('✅ Direct API Test Success:', diagnostic.directApiTest);
        
        // Check why React Query might be different
        if (directData?.gateways?.length !== apiGateways.length) {
          console.warn('⚠️ MISMATCH: Direct API vs React Query counts differ');
          console.log('Direct API count:', directData?.gateways?.length);
          console.log('React Query count:', apiGateways.length);
        }
      } else {
        diagnostic.directApiTest = {
          success: false,
          status: directResponse.status,
          error: await directResponse.text()
        };
      }
    } catch (directError: any) {
      diagnostic.directApiTest = {
        success: false,
        error: directError.message
      };
    }
    
    // Show diagnostic in UI
    if (diagnostic.easebuzz.found) {
      toast.success('✅ Easebuzz Gateway Found!', {
        description: `Provider: ${diagnostic.easebuzz.details?.provider} | Name: ${diagnostic.easebuzz.details?.name}`,
        duration: 5000
      });
    } else {
      if (diagnostic.directApiTest?.success && diagnostic.directApiTest?.easebuzzInDirect) {
        toast.error('🔧 React Query Issue!', {
          description: 'Easebuzz found in direct API but not in React Query. Check browser console.',
          duration: 8000
        });
      } else if (diagnostic.directApiTest?.success) {
        toast.error('❌ Easebuzz Not in Database!', {
          description: `Found ${diagnostic.directApiTest.data?.gateways?.length || 0} gateways, but no Easebuzz.`,
          duration: 8000
        });
      } else {
        toast.error('🌐 Backend Connection Failed!', {
          description: 'Cannot connect to Railway backend. Check internet connection.',
          duration: 8000
        });
      }
    }
    
    console.log('🔍 === DIAGNOSTIC COMPLETE ===');
    return diagnostic;
  };

  // Real Money Payment Test Function
  const createRealPaymentTest = async () => {
    console.log('💰 Creating real money payment test for ₹10...');
    
    try {
      // Show loading toast
      toast.info('💰 Creating real payment link...', { duration: 2000 });
      
      // Generate unique order ID
      const orderId = `REAL_TEST_${Date.now()}`;
      const customerEmail = 'test@lightspeedpay.com';
      const customerPhone = '9999999999';
      const customerName = 'Real Test User';
      const amount = 10;
      
      console.log('📋 Payment Details:', {
        amount,
        orderId,
        customerName,
        customerEmail,
        customerPhone
      });
      
      // Use demo client credentials for testing
      console.log('🔐 Using REAL NGME client credentials for payment...');
      const realClientKey = 'FQABLVIEYC';
      const realClientSalt = 'QECGU7UHNT';
      
      // Create payment request with demo client credentials
      const response = await fetch('https://trmqbpnnboyoneyfleux.supabase.co/functions/v1/create-ngme-payment-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': realClientKey,
          'x-api-secret': realClientSalt,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk'}`
        },
        body: JSON.stringify({
          amount: amount,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          order_id: orderId,
          description: `Real Money Test Payment - ₹${amount}`,
          test_mode: false // Set to false for real money
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Payment creation failed. Status:', response.status, 'Error details:', errorText);
        throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
      }
      
      const paymentData = await response.json();
      
      if (paymentData.success && paymentData.checkout_url) {
        console.log('🎉 Payment link created successfully!');
        console.log('💳 Payment URL:', paymentData.checkout_url);
        console.log('🆔 Transaction ID:', paymentData.payment?.transaction_id);
        console.log('📱 Order ID:', orderId);
        
        // Success toast with action
        toast.success('🎉 Real Payment Link Created!', {
          description: `₹${amount} • Order: ${orderId}`,
          duration: 8000,
          action: {
            label: 'Open Payment',
            onClick: () => window.open(paymentData.checkout_url, '_blank')
          }
        });
        
        // Also open payment page automatically
        setTimeout(() => {
          const shouldOpen = confirm(
            `✅ Real payment link created for ₹${amount}!\n\n` +
            `Transaction ID: ${paymentData.payment?.transaction_id}\n` +
            `Order ID: ${orderId}\n\n` +
            `Open payment page now to complete with UPI?`
          );
          
          if (shouldOpen) {
            window.open(paymentData.checkout_url, '_blank');
          }
        }, 500);
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(paymentData.checkout_url);
          setTimeout(() => {
            toast.info('📋 Payment URL copied to clipboard!', { duration: 3000 });
          }, 1000);
        }
        
        return {
          success: true,
          payment_url: paymentData.checkout_url,
          transaction_id: paymentData.payment?.transaction_id,
          order_id: orderId,
          amount: amount
        };
        
      } else {
        throw new Error(paymentData.message || 'Payment creation failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating payment test:', error);
      toast.error(`❌ Payment Test Failed: ${error.message}`, { duration: 5000 });
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  // 🚀 QUICK FIX: Update NGME Gateway Name
  const quickFixNGMEName = async () => {
    try {
      console.log('🔧 Quick Fix: Updating NGME Gateway Name...');
      toast.info('🔧 NGME Gateway name update हो रहा है...', { duration: 2000 });
      
      // Find NextGen/Easebuzz gateway with broader criteria
      console.log('🔍 Searching for gateway among:', gateways.map(g => ({ id: g.id, name: g.name, provider: g.provider })));
      const targetGateway = gateways.find(g => 
        g.provider?.toLowerCase().includes('ease') || 
        g.provider?.toLowerCase().includes('buzz') || 
        g.provider?.toLowerCase().includes('next') || 
        g.provider?.toLowerCase().includes('ngme') ||
        g.name?.toLowerCase().includes('ease') ||
        g.name?.toLowerCase().includes('buzz') ||
        g.name?.toLowerCase().includes('next') ||
        g.name?.toLowerCase().includes('ngme')
      );
      
      if (!targetGateway) {
        console.error('❌ No gateway found matching Easebuzz/NGME criteria. Available gateways:', gateways);
        throw new Error('Easebuzz gateway not found');
      }
      
      console.log('✅ Found target gateway for NGME update:', targetGateway);
      
      // Update name to NGME's bus
      const response = await fetch(`https://web-production-0b337.up.railway.app/api/v1/admin/gateways/${targetGateway.id}`, {
        method: 'PUT',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "🚀 NGME's bus, payment gateway",
          provider: "easebuzz",
          credentials: targetGateway.credentials || {},
          webhook_url: targetGateway.webhook_url || '',
          environment: targetGateway.environment || 'production',
          priority: 1,
          is_active: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      
      toast.success('✅ NGME Gateway name successfully updated!', {
        description: 'Dashboard को refresh करें NGME tab देखने के लिए',
        duration: 5000
      });
      
      // Refresh gateways data
      setTimeout(() => {
        refetch();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Quick fix failed:', error);
      toast.error('❌ Gateway name update failed', {
        description: error.message,
        duration: 5000
      });
    }
  };

  // Update Easebuzz Gateway with NGM Tech Growth credentials
  const updateEasebuzzGateway = () => {
    const easebuzzGateways = gateways.filter(g => g.provider === 'easebuzz');
    if (easebuzzGateways.length > 0) {
      const primaryGateway = easebuzzGateways[0];
      const updatedGateway = {
        ...primaryGateway,
        name: 'Easebuzz - NGM Tech Growth',
        api_key: 'FQABLVIEYC',
        api_secret: 'QECGU7UHNT',
        client_id: '682d9154e352d26417059640',
        is_active: true,
        priority: 1
      };
      apiService.updateGateway(primaryGateway.id, updatedGateway)
        .then(response => {
          toast.success('Easebuzz Gateway updated successfully');
          refetch();
        })
        .catch(error => {
          toast.error('Failed to update Easebuzz Gateway: ' + error.message);
        });
      // Deactivate other Easebuzz gateways
      easebuzzGateways.slice(1).forEach(otherGateway => {
        apiService.updateGateway(otherGateway.id, { ...otherGateway, is_active: false })
          .then(() => console.log(`Deactivated Easebuzz Gateway: ${otherGateway.name}`))
          .catch(err => console.error(`Failed to deactivate Easebuzz Gateway: ${otherGateway.name}`, err));
      });
    } else {
      // If no Easebuzz gateway exists, create a new one
      const newGateway = {
        name: 'Easebuzz - NGM Tech Growth',
        provider: 'easebuzz',
        api_key: 'FQABLVIEYC',
        api_secret: 'QECGU7UHNT',
        client_id: '682d9154e352d26417059640',
        is_active: true,
        priority: 1,
        monthly_limit: 1000000
      };
      apiService.createGateway(newGateway)
        .then(response => {
          toast.success('Easebuzz Gateway added successfully');
          refetch();
        })
        .catch(error => {
          toast.error('Failed to add Easebuzz Gateway: ' + error.message);
        });
    }
  };

  // Add or Update PayU Money Gateway
  const handlePayUUpdate = () => {
    const payuGateway = gateways.find(g => g.provider === 'payu' && g.name.includes('Next Gen Techno Ventures'));
    const newPayUCreds = {
      name: 'PayU Money - Next Gen Techno Ventures',
      provider: 'payu',
      api_key: 'xKLUxQ',
      api_secret: 'OhIeWQdMjtR4K7w1alV6c2emB6RnKXWA',
      is_active: true,
      priority: 1,
      monthly_limit: 1000000
    };

    if (payuGateway) {
      // Update existing PayU gateway
      apiService.updateGateway(payuGateway.id, newPayUCreds)
        .then(response => {
          toast.success('PayU Money Gateway updated successfully');
          refetch();
        })
        .catch(error => {
          toast.error('Failed to update PayU Money Gateway: ' + error.message);
        });
    } else {
      // Create new PayU gateway
      apiService.createGateway(newPayUCreds)
        .then(response => {
          toast.success('PayU Money Gateway added successfully');
          refetch();
        })
        .catch(error => {
          toast.error('Failed to add PayU Money Gateway: ' + error.message);
        });
    }
  };

  const handleAddPayUGateway = () => {
    // Automatically add PayU gateway with pre-filled credentials
    const payuCredentials = {
      name: 'PayU Money Production',
      provider: 'payu',
      api_key: 'xKLUxQ',
      api_secret: 'OhIeWQdMjtR4K7w1alV6c2emB6RnKXWA',
      client_id: 'caf72985a7761ab9938a202da34bfd79fc91eae257a9c400de08670f690aa41b',
      client_secret: '5055b162f2ebe71fb814e5cf36ebbf4d32f0b5c7e6bfd3f70da415bbe1a993ff',
      environment: 'production',
      webhook_url: 'https://api.lightspeedpay.in/api/v1/callback/payu',
      success_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/success',
      failed_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/failed',
      commission_type: 'percentage',
      commission_value: 2.5,
      priority: 2,
      is_active: true
    };
    
    setShowPayUModal(true);
  };

  const handleSavePayUGateway = async (formData: any) => {
    try {
      const gatewayData = {
        name: formData.name,
        provider: formData.provider,
        credentials: {
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          client_id: formData.client_id,
          client_secret: formData.client_secret,
          provider: formData.provider
        },
        environment: formData.environment,
        webhook_url: formData.webhook_url,
        success_url: formData.success_url,
        failed_url: formData.failed_url,
        commission_type: formData.commission_type,
        commission_value: formData.commission_value,
        priority: formData.priority,
        is_active: formData.is_active
      };
      
      await apiService.createGateway(gatewayData);
      setShowPayUModal(false);
      refetch(); // React Query will auto-refetch due to invalidation
    } catch (error: any) {
      console.error('Failed to save PayU gateway:', error);
      toast.error('❌ PayU Gateway Save Failed', {
        description: error.message || 'Unknown error occurred',
        duration: 5000
      });
      throw error; // Re-throw to ensure caller knows about the failure
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <LoadingSpinner size="h-8 w-8" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Payment Gateway Management</CardTitle>
            <CardDescription>
              Configure and monitor your payment gateways
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Add temporary test button */}
            <Button
              onClick={testRealBackendAPI}
              variant="outline"
              size="sm"
              className="bg-orange-50 border-orange-200 hover:bg-orange-100"
            >
              🧪 Test Real API
            </Button>
            <Button
              onClick={runCompleteDiagnostic}
              variant="outline"
              size="sm"
              className="bg-purple-50 border-purple-200 hover:bg-purple-100"
            >
              🔍 Debug Easebuzz
            </Button>
            <Button
              onClick={quickFixNGMEName}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              🔧 Fix NGME Name
            </Button>
            <Button
              onClick={createRealPaymentTest}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              💰 Real Money Test (₹10)
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
            <Button
              onClick={handleAddPayUGateway}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add PayU Gateway
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
            >
              <Link href="/dashboard/admin/easebuzz" className="inline-flex items-center gap-2">
                🚀 Easebuzz Page
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-amber-50 border-amber-200 hover:bg-amber-100"
            >
              <Link href="/dashboard/admin/aesbus" className="inline-flex items-center gap-2">
                🚀 AES Bus Page
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="easebuzz" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
                                <span>NGME's bus</span>
              {easebuzzGateway && (
                <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 text-xs">
                  Active
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-gateways" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>All Gateways</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Gateway Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Gateways</p>
                      <p className="text-2xl font-bold text-green-600">
                        {gateways.filter(g => g.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Volume</p>
                      <p className="text-2xl font-bold text-blue-600">$2.3M</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Success Rate</p>
                      <p className="text-2xl font-bold text-purple-600">98.2%</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Regions</p>
                      <p className="text-2xl font-bold text-orange-600">3</p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {easebuzzGateway ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">NGME's bus, payment gateway</p>
                          <p className="text-sm text-green-700">Production Ready • Priority 1 • 98.5% Success Rate</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("easebuzz")}
                        className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                      >
                        Manage
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-yellow-900">Easebuzz Gateway Not Found</p>
                          <p className="text-sm text-yellow-700">Setup your NGME's bus Easebuzz gateway</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("easebuzz")}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                      >
                        Setup
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    Total Gateways: {gateways.length} | Active: {gateways.filter(g => g.status === 'active').length} | Highest Priority: {Math.min(...gateways.map(g => g.priority || 100))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="easebuzz" className="space-y-6">
            <EasebuzzQuickSetup />
          </TabsContent>

          <TabsContent value="all-gateways" className="space-y-6">
            {/* Gateway List - Draggable for Priority */}
            <DraggableGatewayList
              gateways={gateways}
              onToggleStatus={toggleGatewayStatus}
              onTestConnection={testConnection}
              onConfigure={openConfigModal}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Add Gateway Modal */}
      <AddGatewayModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddGatewaySuccess}
      />

      {/* Gateway Configuration Modal */}
      <GatewayConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setConfigGateway(null);
        }}
        gateway={configGateway}
        onSuccess={handleConfigGatewaySuccess}
      />

      {showPayUModal && (
        <GatewayConfigurationModal
          isOpen={showPayUModal}
          onClose={() => setShowPayUModal(false)}
          onSave={handleSavePayUGateway}
          gateway={{
            id: '',
            name: 'PayU Money',
            provider: 'payu',
            status: 'inactive',
            priority: 2,
            successRate: 0,
            dailyLimit: 0,
            currentUsage: 0,
            responseTime: 0,
            fees: 2.5,
            region: 'PROD',
            api_key: 'xKLUxQ',
            api_secret: 'OhIeWQdMjtR4K7w1alV6c2emB6RnKXWA',
            client_id: 'caf72985a7761ab9938a202da34bfd79fc91eae257a9c400de08670f690aa41b',
            client_secret: '5055b162f2ebe71fb814e5cf36ebbf4d32f0b5c7e6bfd3f70da415bbe1a993ff',
            webhook_url: 'https://api.lightspeedpay.in/api/v1/callback/payu',
            success_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/success',
            failed_url: 'https://api.lightspeedpay.in/api/v1/callback/payu/failed',
            is_active: true,
            environment: 'production'
          }}
        />
      )}
    </Card>
  );
};
