import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Settings, Zap, DollarSign, Globe, Shield, Plus } from 'lucide-react';
import { apiService } from '@/services/api';
import { useGateways } from '@/hooks/useGateways';
import { subscribeToGatewayHealth } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddGatewayModal } from './AddGatewayModal';
import { GatewayConfigurationModal } from './GatewayConfigurationModal';
import { DraggableGatewayList } from './DraggableGatewayList';

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
  const { gateways: apiGateways, isLoading, refetch, updateGateway } = useGateways();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configGateway, setConfigGateway] = useState<Gateway | null>(null);

  // Sync gateways from React Query
  useEffect(() => {
    setGateways(apiGateways || []);
  }, [apiGateways]);

  // Subscribe to real-time health metrics to update gateways status/performance
  useEffect(() => {
    const unsubscribe = subscribeToGatewayHealth((metric) => {
      setGateways((prev) =>
        prev.map((g) =>
          g.id === metric.gateway_id
            ? {
                ...g,
                responseTime: metric.response_time_ms,
                status: metric.is_available ? 'active' : 'inactive',
              }
            : g,
        ),
      );
    });
    return unsubscribe;
  }, []);

  const toggleGatewayStatus = async (id: string) => {
    const gateway = gateways.find(g => g.id === id);
    if (!gateway) return;

    const newStatus = gateway.status === 'active' ? 'inactive' : 'active';
    setGateways(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
    try {
      await updateGateway({ id, updates: { status: newStatus } });
    } catch (e) {
      console.error('Failed to toggle status, reverting.', e);
      setGateways(prev => prev.map(g => g.id === id ? { ...g, status: gateway.status } : g));
    }
  };

  const updatePriority = async (id: string, priority: number) => {
    const gateway = gateways.find(g => g.id === id);
    if (!gateway) return;

    setGateways(prev => prev.map(gateway => gateway.id === id ? { ...gateway, priority } : gateway));
    try {
      await updateGateway({ id, updates: { priority } });
    } catch (e) {
      console.error('Failed to update priority, reverting.', e);
      setGateways(prev => prev.map(g => g.id === id ? { ...g, priority: gateway.priority } : g));
    }
  };

  const testConnection = async (id: string) => {
    try {
      const result = await apiService.testGateway(id);
      alert(`Gateway test result: ${JSON.stringify(result)}`);
    } catch (e) {
      alert('Gateway test failed.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddGatewaySuccess = () => {
    refetch();
  };

  const handleConfigGatewaySuccess = () => {
    refetch();
  };

  const openConfigModal = (gateway: Gateway) => {
    setConfigGateway(gateway);
    setIsConfigModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <LoadingSpinner size="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gateway Management</h1>
          <p className="text-gray-600">Manage payment gateways, priorities, and routing</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Gateway
          </Button>
        </div>
      </div>

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

      {/* Gateway List - Draggable for Priority */}
      <DraggableGatewayList
        gateways={gateways}
        onToggleStatus={toggleGatewayStatus}
        onTestConnection={testConnection}
        onConfigure={openConfigModal}
        onPriorityChange={(updatedGateways) => {
          setGateways(updatedGateways);
          refetch();
        }}
      />
    </div>
  );
};
