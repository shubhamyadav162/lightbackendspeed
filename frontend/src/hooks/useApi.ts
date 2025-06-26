import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, subscribeToTransactions, subscribeToAlerts, subscribeToAuditLogs } from '../services/api';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Gateway Management Hooks
export const useGateways = () => {
  return useQuery({
    queryKey: ['gateways'],
    queryFn: apiService.getGateways,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.createGateway,
    onMutate: async (newGateway) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['gateways'] });
      
      // Snapshot the previous value
      const previousGateways = queryClient.getQueryData(['gateways']);
      
      // Optimistically update to the new value
      const optimisticGateway = {
        ...newGateway,
        id: `temp_${Date.now()}`,
        status: 'active',
        successRate: 100,
        currentUsage: 0,
        responseTime: 0,
        region: 'IN'
      };
      
      queryClient.setQueryData(['gateways'], (old: any[]) => [...(old || []), optimisticGateway]);
      
      // Show optimistic toast
      toast.success('नया Gateway जोड़ा जा रहा है...', { duration: 1000 });
      
      return { previousGateways };
    },
    onError: (err, newGateway, context) => {
      queryClient.setQueryData(['gateways'], context?.previousGateways);
      toast.error('Gateway जोड़ने में विफल - कृपया पुनः प्रयास करें');
    },
    onSuccess: () => {
      toast.success('🎉 Gateway सफलतापूर्वक जोड़ा गया!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
  });
};

export const useUpdateGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiService.updateGateway(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['gateways'] });
      
      const previousGateways = queryClient.getQueryData(['gateways']);
      
      // Optimistically update
      queryClient.setQueryData(['gateways'], (old: any[]) =>
        old?.map(gateway => gateway.id === id ? { ...gateway, ...updates } : gateway) || []
      );
      
      return { previousGateways };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['gateways'], context?.previousGateways);
      toast.error('Gateway update में विफल - कनेक्शन चेक करें');
    },
    onSuccess: () => {
      toast.success('✅ Gateway सफलतापूर्वक update किया गया');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
  });
};

export const useDeleteGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteGateway(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['gateways'] });
      
      const previousGateways = queryClient.getQueryData(['gateways']);
      
      // Optimistically remove
      queryClient.setQueryData(['gateways'], (old: any[]) =>
        old?.filter(gateway => gateway.id !== id) || []
      );
      
      toast.info('Gateway delete हो रहा है...', { duration: 1000 });
      
      return { previousGateways };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['gateways'], context?.previousGateways);
      toast.error('Gateway delete करने में विफल - कृपया बाद में प्रयास करें');
    },
    onSuccess: () => {
      toast.success('🗑️ Gateway सफलतापूर्वक delete किया गया');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
  });
};

export const useBulkUpdateGatewayPriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.bulkUpdateGatewayPriority,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['gateways'] });
      
      const previousGateways = queryClient.getQueryData(['gateways']);
      
      // Optimistically update priorities
      queryClient.setQueryData(['gateways'], (old: any[]) => {
        const updated = [...(old || [])];
        payload.priorities.forEach(({ id, priority }) => {
          const index = updated.findIndex(g => g.id === id);
          if (index >= 0) {
            updated[index] = { ...updated[index], priority };
          }
        });
        return updated.sort((a, b) => a.priority - b.priority);
      });
      
      toast.info('Priorities save हो रही हैं...', { duration: 1000 });
      
      return { previousGateways };
    },
    onError: (err, payload, context) => {
      queryClient.setQueryData(['gateways'], context?.previousGateways);
      toast.error('Priority update में विफल - कनेक्शन चेक करें');
    },
    onSuccess: () => {
      toast.success('🔄 Gateway priorities सफलतापूर्वक update किए गए');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
  });
};

// Queue Management Hooks with Enhanced Optimistic Updates
export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: apiService.getQueueSystemStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useRetryQueueJobs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.retryQueueJobs,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['queue-stats'] });
      
      const previousStats = queryClient.getQueryData(['queue-stats']);
      
      // Optimistically update queue stats
      if (payload.queue) {
        queryClient.setQueryData(['queue-stats'], (old: any[]) => {
          return old?.map(queue => {
            if (queue.name === payload.queue) {
              return {
                ...queue,
                waiting: queue.waiting + queue.failed,
                failed: 0
              };
            }
            return queue;
          }) || [];
        });
        
        toast.info('Failed jobs retry हो रहे हैं...', { duration: 1500 });
      }
      
      return { previousStats };
    },
    onError: (err, payload, context) => {
      queryClient.setQueryData(['queue-stats'], context?.previousStats);
      toast.error('Job retry में विफल - सिस्टम व्यस्त हो सकता है');
    },
    onSuccess: () => {
      toast.success('🔄 Failed jobs retry के लिए queue किए गए');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
};

export const usePauseQueue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.pauseQueue,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['queue-stats'] });
      
      const previousStats = queryClient.getQueryData(['queue-stats']);
      
      // Optimistically update queue status
      queryClient.setQueryData(['queue-stats'], (old: any[]) => {
        return old?.map(queue => {
          if (queue.name === payload.queue) {
            return { ...queue, paused: payload.pause };
          }
          return queue;
        }) || [];
      });
      
      const action = payload.pause ? 'pause' : 'resume';
      toast.info(`Queue ${action} हो रहा है...`, { duration: 1000 });
      
      return { previousStats };
    },
    onError: (err, payload, context) => {
      queryClient.setQueryData(['queue-stats'], context?.previousStats);
      toast.error(`Queue ${payload.pause ? 'pause' : 'resume'} में विफल - सर्वर error`);
    },
    onSuccess: (data, payload) => {
      const action = payload.pause ? 'paused' : 'resumed';
      const emoji = payload.pause ? '⏸️' : '▶️';
      toast.success(`${emoji} Queue ${action} सफलतापूर्वक`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
};

export const useCleanQueues = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.cleanQueues,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['queue-stats'] });
      
      const previousStats = queryClient.getQueryData(['queue-stats']);
      
      // Optimistically update completed count
      if (payload.queue) {
        queryClient.setQueryData(['queue-stats'], (old: any[]) => {
          return old?.map(queue => {
            if (queue.name === payload.queue) {
              return { ...queue, completed: 0 };
            }
            return queue;
          }) || [];
        });
        
        toast.info('Completed jobs साफ किए जा रहे हैं...', { duration: 1500 });
      }
      
      return { previousStats };
    },
    onError: (err, payload, context) => {
      queryClient.setQueryData(['queue-stats'], context?.previousStats);
      toast.error('Queue clean करने में विफल - फिर से कोशिश करें');
    },
    onSuccess: () => {
      toast.success('🧹 Completed jobs सफलतापूर्वक साफ किए गए');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
};

// Enhanced Transaction Management with Real-time
export const useTransactions = (params?: any) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => apiService.getTransactions(params),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToTransactions((payload) => {
      console.log('Transaction update:', payload);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Show toast for new transactions
      if (payload.status === 'success') {
        toast.success(`💰 नया payment success: ₹${payload.amount}`);
      } else if (payload.status === 'failed') {
        toast.error(`❌ Payment failed: ₹${payload.amount}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return query;
};

// Enhanced Wallet Management
export const useWallets = () => {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: apiService.getWallets,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiService.updateClient(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      
      const previousWallets = queryClient.getQueryData(['wallets']);
      const previousClients = queryClient.getQueryData(['clients']);
      
      // Optimistically update clients
      queryClient.setQueryData(['clients'], (old: any[]) =>
        old?.map(client => client.id === id ? { ...client, ...updates } : client) || []
      );
      
      toast.info('Client update हो रहा है...', { duration: 1000 });
      
      return { previousWallets, previousClients };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['wallets'], context?.previousWallets);
      queryClient.setQueryData(['clients'], context?.previousClients);
      toast.error('Client update में विफल - डेटा validation error');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('👤 Client सफलतापूर्वक update किया गया');
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.createClient,
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      
      const previousWallets = queryClient.getQueryData(['wallets']);
      const previousClients = queryClient.getQueryData(['clients']);
      
      // Optimistically add new client
      const optimisticClient = {
        ...newClient,
        id: `temp_${Date.now()}`,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      queryClient.setQueryData(['clients'], (old: any[]) => [...(old || []), optimisticClient]);
      
      toast.info('नया client जोड़ा जा रहा है...', { duration: 1000 });
      
      return { previousWallets, previousClients };
    },
    onError: (err, newClient, context) => {
      queryClient.setQueryData(['wallets'], context?.previousWallets);
      queryClient.setQueryData(['clients'], context?.previousClients);
      toast.error('Client जोड़ने में विफल - API key conflict हो सकता है');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('🎉 नया client सफलतापूर्वक जोड़ा गया');
    },
  });
};

// System Status Hooks
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: apiService.getSystemStatus,
    refetchInterval: 5000, // Refetch every 5 seconds for system status
  });
};

// Alert Management Hooks
export const useAlerts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: apiService.getAlerts,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToAlerts((payload) => {
      console.log('Alert update:', payload);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      // Show toast for critical alerts
      if (payload.severity === 'critical') {
        toast.error(`🚨 Critical Alert: ${payload.message}`);
      } else if (payload.severity === 'warning') {
        toast.warning(`⚠️ Warning: ${payload.message}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return query;
};

// Analytics Hooks
export const useAnalytics = (params?: any) => {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => apiService.getAnalytics(params),
    refetchInterval: 60000, // Refetch every minute
  });
};

// Dashboard Overview Hook
export const useDashboardOverview = () => {
  const transactions = useTransactions();
  const wallets = useWallets();
  const systemStatus = useSystemStatus();
  const alerts = useAlerts();
  const queueStats = useQueueStats();

  return {
    transactions,
    wallets,
    systemStatus,
    alerts,
    queueStats,
    isLoading: 
      transactions.isLoading || 
      wallets.isLoading || 
      systemStatus.isLoading || 
      alerts.isLoading || 
      queueStats.isLoading,
  };
};

// Developer Tools Hooks
export const useMerchantCredentials = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['merchant-credentials'],
    queryFn: apiService.getMerchantCredentials,
    refetchInterval: 60000,
  });
};

export const useRegenerateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.regenerateMerchantCredentials,
    onMutate: async () => {
      toast.info('नई credentials generate हो रही हैं...', { duration: 2000 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-credentials'] });
      toast.success('🔑 Credentials सफलतापूर्वक regenerate किए गए');
    },
    onError: () => {
      toast.error('Credentials regenerate करने में विफल - सर्वर error');
    },
  });
};

export const useMerchantUsage = () => {
  return useQuery({
    queryKey: ['merchant-usage'],
    queryFn: apiService.getMerchantUsage,
    refetchInterval: 60000,
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: apiService.testWebhookEndpoint,
    onMutate: async () => {
      toast.info('Webhook test चल रहा है...', { duration: 2000 });
    },
    onSuccess: () => {
      toast.success('✅ Webhook test सफलतापूर्वक completed');
    },
    onError: () => {
      toast.error('Webhook test में विफल - endpoint accessible नहीं');
    },
  });
};

// Audit Logs Hooks
export const useAuditLogs = (params?: any) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => apiService.getAuditLogs(params),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs(() => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    });
    return () => {
      unsubscribe?.();
    };
  }, [queryClient]);

  return query;
}; 