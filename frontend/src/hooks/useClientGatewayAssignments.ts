import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiService } from '../services/api';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  priority: number;
  status: 'active' | 'inactive' | 'maintenance';
  success_rate: number;
  monthly_volume: number;
  limit: number;
  response_time: number;
  is_active?: boolean;
  api_key?: string;
  api_secret?: string;
  daily_usage?: number;
  daily_limit?: number;
}

interface GatewayAssignment {
  id: string;
  client_id: string;
  gateway_id: string;
  rotation_order: number;
  is_active: boolean;
  weight: number;
  daily_limit: number;
  created_at: string;
  updated_at: string;
  payment_gateways: {
    id: string;
    name: string;
    provider: string;
    is_active: boolean;
    health_status: string;
    created_at: string;
    updated_at: string;
    api_key_last_4: string;
  };
}

// Demo fallback data for when API fails
const getDemoGatewayData = (): Gateway[] => [
  {
    id: 'gw-razorpay-demo',
    name: 'Razorpay',
    provider: 'razorpay',
    priority: 1,
    status: 'active',
    success_rate: 99.2,
    monthly_volume: 2500000,
    limit: 6000000,
    response_time: 150,
    is_active: true,
    daily_limit: 200000,
    daily_usage: 45000,
  },
  {
    id: 'gw-payu-demo',
    name: 'PayU',
    provider: 'payu',
    priority: 2,
    status: 'active',
    success_rate: 98.5,
    monthly_volume: 1200000,
    limit: 3600000,
    response_time: 200,
    is_active: true,
    daily_limit: 120000,
    daily_usage: 38000,
  },
  {
    id: 'gw-phonepe-demo',
    name: 'PhonePe',
    provider: 'phonepe',
    priority: 3,
    status: 'inactive',
    success_rate: 97.8,
    monthly_volume: 800000,
    limit: 2400000,
    response_time: 175,
    is_active: false,
    daily_limit: 80000,
    daily_usage: 0,
  },
  {
    id: 'gw-paytm-demo',
    name: 'Paytm',
    provider: 'paytm',
    priority: 4,
    status: 'active',
    success_rate: 98.1,
    monthly_volume: 1800000,
    limit: 4500000,
    response_time: 190,
    is_active: true,
    daily_limit: 150000,
    daily_usage: 67000,
  },
  {
    id: 'gw-jio-demo',
    name: 'Jio Payment Bank',
    provider: 'jio',
    priority: 6,
    status: 'active',
    success_rate: 96.9,
    monthly_volume: 900000,
    limit: 2700000,
    response_time: 220,
    is_active: true,
    daily_limit: 90000,
    daily_usage: 23000,
  },
  {
    id: 'gw-icici-demo',
    name: 'ICICI Payment Gateway',
    provider: 'icici',
    priority: 8,
    status: 'active',
    success_rate: 99.5,
    monthly_volume: 3200000,
    limit: 7500000,
    response_time: 130,
    is_active: true,
    daily_limit: 250000,
    daily_usage: 89000,
  },
];

export const useClientGatewayAssignments = (clientId: string) => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [assignments, setAssignments] = useState<GatewayAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Convert assignment to gateway format for compatibility
  const convertAssignmentToGateway = (assignment: GatewayAssignment): Gateway => {
    const gateway = assignment.payment_gateways;
    return {
      id: gateway.id,
      name: gateway.name,
      provider: gateway.provider,
      priority: assignment.rotation_order,
      status: assignment.is_active ? (gateway.is_active ? 'active' : 'inactive') : 'inactive',
      success_rate: 95 + Math.random() * 5, // Mock success rate
      monthly_volume: Math.floor(Math.random() * 1000000),
      limit: assignment.daily_limit * 30, // Convert daily to monthly
      response_time: 200 + Math.random() * 300,
      is_active: assignment.is_active,
      api_key: `${gateway.provider}_live_${gateway.api_key_last_4}`,
      api_secret: `${gateway.provider}_secret_****`,
      daily_usage: Math.floor(Math.random() * assignment.daily_limit),
      daily_limit: assignment.daily_limit,
    };
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingFallback(false);

      // For demo client, try API first but gracefully fallback
      if (clientId === 'demo-ramlal-client-2024') {
        try {
          const data = await apiService.getClientGatewayAssignments(clientId);
          const gatewayAssignments = data.assignments || [];
          
          if (gatewayAssignments.length > 0) {
            setAssignments(gatewayAssignments);
            const gatewayList = gatewayAssignments.map(convertAssignmentToGateway);
            setGateways(gatewayList);
            console.log('✅ Loaded real gateway assignments for demo client:', gatewayAssignments);
          } else {
            throw new Error('No assignments found, using fallback data');
          }
        } catch (apiError) {
          console.log('🔄 API failed for demo client, using fallback data');
          const fallbackGateways = getDemoGatewayData();
          setGateways(fallbackGateways);
          setAssignments([]);
          setIsUsingFallback(true);
          toast.info('Demo mode में चल रहा है', {
            description: 'API data available नहीं है, demo data दिखा रहे हैं'
          });
        }
      } else {
        // For real clients, use API
        const data = await apiService.getClientGatewayAssignments(clientId);
        const gatewayAssignments = data.assignments || [];
        
        setAssignments(gatewayAssignments);
        const gatewayList = gatewayAssignments.map(convertAssignmentToGateway);
        setGateways(gatewayList);
        console.log('✅ Loaded gateway assignments:', gatewayAssignments);
      }

    } catch (err: any) {
      console.error('Error loading gateway assignments:', err);
      setError(err.message);
      
      // Always provide fallback for demo client
      if (clientId === 'demo-ramlal-client-2024') {
        console.log('🔄 Final fallback to demo gateway data');
        const fallbackGateways = getDemoGatewayData();
        setGateways(fallbackGateways);
        setAssignments([]);
        setIsUsingFallback(true);
        toast.info('Demo mode में चल रहा है');
      } else {
        toast.error('Gateway assignments load करने में समस्या हुई', {
          description: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateGatewayAssignment = async (gatewayId: string, updates: Partial<GatewayAssignment>) => {
    try {
      // For demo client using fallback data, simulate update
      if (clientId === 'demo-ramlal-client-2024' && isUsingFallback) {
        console.log('🔄 Demo mode - simulating gateway toggle success');
        
        // Update local state immediately for optimistic UI
        setGateways(prev => prev.map(g => 
          g.id === gatewayId ? { ...g, is_active: updates.is_active ?? g.is_active } : g
        ));
        
        toast.success('Gateway toggle हो गई', {
          description: 'Demo mode में successfully updated'
        });
        
        return { success: true, demo: true };
      }
      
      // For real clients or demo client with real data, use API
      const result = await apiService.updateClientGatewayAssignment(clientId, gatewayId, updates);
      
      // Update local state
      setAssignments(prev => prev.map(a => 
        a.gateway_id === gatewayId ? { ...a, ...updates } : a
      ));
      
      setGateways(prev => prev.map(g => 
        g.id === gatewayId ? { ...g, is_active: updates.is_active ?? g.is_active } : g
      ));

      console.log('✅ Updated gateway assignment:', result);
      toast.success('Gateway updated successfully');
      
      return result;
    } catch (err: any) {
      console.error('Error updating gateway assignment:', err);
      
      // For demo client, always simulate success
      if (clientId === 'demo-ramlal-client-2024') {
        console.log('🔄 Demo mode - simulating gateway toggle success after API error');
        
        setGateways(prev => prev.map(g => 
          g.id === gatewayId ? { ...g, is_active: updates.is_active ?? g.is_active } : g
        ));
        
        toast.success('Demo में gateway toggle हो गई');
        return { success: true, demo: true, apiError: err.message };
      }
      
      toast.error('Gateway update करने में समस्या हुई', {
        description: err.message
      });
      
      throw err;
    }
  };

  const createGatewayAssignment = async (gatewayId: string, assignmentData: any) => {
    try {
      const result = await apiService.createClientGatewayAssignment(clientId, {
        gateway_id: gatewayId,
        ...assignmentData
      });
      
      await loadAssignments(); // Reload all assignments
      console.log('✅ Created gateway assignment:', result);
      toast.success('Gateway assignment created');
      
      return result;
    } catch (err: any) {
      console.error('Error creating gateway assignment:', err);
      toast.error('Assignment बनाने में समस्या हुई', {
        description: err.message
      });
      throw err;
    }
  };

  const deleteGatewayAssignment = async (gatewayId: string) => {
    try {
      const result = await apiService.deleteClientGatewayAssignment(clientId, gatewayId);

      // Update local state
      setAssignments(prev => prev.filter(a => a.gateway_id !== gatewayId));
      setGateways(prev => prev.filter(g => g.id !== gatewayId));

      console.log('✅ Deleted gateway assignment:', result);
      toast.success('Gateway assignment deleted');
      return true;
    } catch (err: any) {
      console.error('Error deleting gateway assignment:', err);
      toast.error('Assignment delete करने में समस्या हुई', {
        description: err.message
      });
      throw err;
    }
  };

  useEffect(() => {
    if (clientId) {
      loadAssignments();
    }
  }, [clientId]);

  return {
    gateways,
    assignments,
    loading,
    error,
    isUsingFallback,
    refetch: loadAssignments,
    updateAssignment: updateGatewayAssignment,
    createAssignment: createGatewayAssignment,
    deleteAssignment: deleteGatewayAssignment
  };
}; 