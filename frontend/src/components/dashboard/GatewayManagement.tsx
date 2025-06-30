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
}

export const GatewayManagement = () => {
  // Use React Query data directly - no local state copy needed
  const { data: apiGateways = [], isLoading, refetch } = useGateways();
  const updateGatewayMutation = useUpdateGateway();
  
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configGateway, setConfigGateway] = useState<Gateway | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Memoize processed gateways
  const gateways = useMemo(() => {
    return apiGateways.map(gateway => ({
      ...gateway,
      ...healthMetrics[gateway.id] // Apply health metrics if available
    }));
  }, [apiGateways, healthMetrics]);

  // Check if Easebuzz gateway exists
  const easebuzzGateway = useMemo(() => {
    return gateways.find(g => g.provider === 'easebuzz');
  }, [gateways]);

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
        if (subscription && typeof subscription === 'function') {
          subscription();
        }
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
    // React Query will automatically refetch due to invalidation in useCreateGateway
    console.log('✅ Gateway added successfully - data will auto-refresh');
  }, []);

  const handleConfigGatewaySuccess = useCallback(() => {
    // React Query will automatically refetch due to invalidation in useUpdateGateway
    console.log('✅ Gateway configured successfully - data will auto-refresh');
  }, []);

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
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
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
              <span>NextGen Techno - Easebuzz</span>
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
                          <p className="font-medium text-green-900">NextGen Techno - Easebuzz Gateway</p>
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
                          <p className="text-sm text-yellow-700">Setup your NextGen Techno Ventures Easebuzz gateway</p>
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
    </Card>
  );
};
