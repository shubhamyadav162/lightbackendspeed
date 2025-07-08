import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, subscribeToTransactions } from '../services/api';
import { useEffect } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { supabase } from '../lib/supabase';
import { isValidISODate } from '../lib/dateUtils';

// Gateway Management Hooks
export const useGateways = () => {
  return useQuery({
    queryKey: ['gateways'],
    queryFn: () => apiService.getGateways(),
  });
};

export const useToggleGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await fetch(`/api/v1/admin/gateways/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key' // TODO: Replace with secure API key management
        },
        body: JSON.stringify({ is_active: active })
      });
      if (!response.ok) {
        throw new Error('Failed to update gateway status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
      toast.success('✅ Gateway successfully updated');
    },
    onError: () => {
      toast.error('Failed to update gateway');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
      toast.success('🔄 Gateway priorities successfully updated');
    },
    onError: () => {
      toast.error('Failed to update priorities');
    },
  });
};

// Queue Management Hooks
export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: apiService.getQueueSystemStats,
    refetchInterval: 5000,
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
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      const action = payload.pause ? 'paused' : 'resumed';
      const emoji = payload.pause ? '⏸️' : '▶️';
      toast.success(`${emoji} Queue ${action} successfully`);
    },
    onError: (err, payload) => {
       toast.error(`Failed to ${payload.pause ? 'pause' : 'resume'} queue`);
    }
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

// Transaction Management Hooks
export const useTransactions = (params?: any) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => apiService.getTransactions(params),
    refetchInterval: 10000,
  });
};

// System Status Hooks
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: apiService.getSystemStatus,
    refetchInterval: 30000,
  });
};

// Helper to check valid ISO 8601 date string
/*
function isValidISODate(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(dateStr);
}
*/

function sanitizeAnalyticsParams(params?: { from?: string, to?: string, gateway?: string, merchantId?: string, timezone?: string }) {
  if (!params) return undefined;
  const sanitized: any = {};
  if (params.from && isValidISODate(params.from)) sanitized.from = params.from;
  if (params.to && isValidISODate(params.to)) sanitized.to = params.to;
  if (params.gateway) sanitized.gateway = params.gateway;
  if (params.merchantId) sanitized.merchantId = params.merchantId;
  if (params.timezone) sanitized.timezone = params.timezone;
  return sanitized;
}

// Analytics Hooks
export const useAnalytics = (params?: { from?: string, to?: string, gateway?: string, merchantId?: string, timezone?: string }) => {
  // Default: last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultFrom = thirtyDaysAgo.toISOString();
  const defaultTo = now.toISOString();

  const safeParams = {
    ...params,
    from: params?.from && isValidISODate(params.from) ? params.from : defaultFrom,
    to: params?.to && isValidISODate(params.to) ? params.to : defaultTo,
  };
  const sanitizedParams = sanitizeAnalyticsParams(safeParams);
  return useQuery({
    queryKey: ['analytics', sanitizedParams],
    queryFn: () => apiService.getAnalytics(sanitizedParams),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Dashboard Overview Hook
export const useDashboardOverview = () => {
  const transactions = useTransactions();
  const systemStatus = useSystemStatus();
  const queueStats = useQueueStats();

  return {
    transactions,
    systemStatus,
    queueStats,
    isLoading: 
      transactions.isLoading || 
      systemStatus.isLoading || 
      queueStats.isLoading,
  };
};

// Developer Tools Hooks
export const useCredentialHistory = (merchantId: string | null) => {
  return useQuery({
    queryKey: ['credentialHistory', merchantId],
    queryFn: () => apiService.getCredentialHistory(merchantId!),
    enabled: !!merchantId,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMerchantCredentials = (merchantId: string | null) => {
  return useQuery({
    queryKey: ['merchantCredentials', merchantId],
    queryFn: () => apiService.getMerchantCredentials(merchantId),
    enabled: !!merchantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRegenerateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, label }: { merchantId: string, label: string }) => 
      apiService.regenerateMerchantCredentials(merchantId, label),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['merchantCredentials', variables.merchantId] });
      queryClient.invalidateQueries({ queryKey: ['credentialHistory', variables.merchantId] });
      toast.success('🔑 Credentials successfully regenerated');
    },
    onError: () => {
      toast.error('Failed to regenerate credentials');
    }
  });
};

export const useMerchantUsage = (merchantId: string | null) => {
  return useQuery({
    queryKey: ['merchantUsage', merchantId],
    queryFn: () => apiService.getMerchantUsage(merchantId),
    enabled: !!merchantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: (params: { url: string, merchantId: string }) => apiService.testWebhook(params),
     onSuccess: () => {
       toast.success('✅ Webhook test sent successfully');
     },
     onError: () => {
       toast.error('Failed to send test webhook');
     },
  });
};

/*
// This hook is currently broken as getAuditLogs is not defined in apiService.
// Commenting out to resolve build errors until it is implemented.
export const useAuditLogs = (params?: any) => {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => apiService.getAuditLogs(params),
    staleTime: 1000 * 60 * 1, // 1 minute
    select: (data) => data.data
  });
};
*/

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
};

export function useApi<T>(path: string) {
  const { data, error, isLoading } = useSWR<T>(path, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // 30 seconds
    dedupingInterval: 5000 // 5 seconds
  });

  return {
    data,
    error,
    isLoading,
    mutate: () => mutate(path)
  };
}

export async function createGateway(data: any) {
  const { error } = await supabase
    .from('payment_gateways')
    .insert(data);
  
  if (error) throw error;
  
  // Invalidate gateway list cache
  await mutate('/api/gateways');
  await mutate('/api/gateway-health');
}

export async function updateGateway(id: string, data: any) {
  const { error } = await supabase
    .from('payment_gateways')
    .update(data)
    .eq('id', id);
  
  if (error) throw error;
  
  // Invalidate gateway list and health caches
  await mutate('/api/gateways');
  await mutate('/api/gateway-health');
  await mutate(`/api/gateways/${id}`);
}

export async function deleteGateway(id: string) {
  const { error } = await supabase
    .from('payment_gateways')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Invalidate gateway list cache
  await mutate('/api/gateways');
  await mutate('/api/gateway-health');
}

// --- Queue Monitoring Hooks ---

export const useQueueMetrics = () => {
  return useQuery({
    queryKey: ['queue-metrics'],
    queryFn: async () => {
      // TODO: Replace with secure API key management
      const response = await fetch('/api/v1/admin/queues', {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue metrics');
      }
      return response.json();
    },
    refetchInterval: 5000 // Refetch every 5 seconds
  });
};

// --- Commission Ledger Hooks ---

export const useCommissionData = () => {
  return useQuery({
    queryKey: ['commission-ledger'],
    queryFn: async () => {
      // TODO: Replace with secure API key management
      const response = await fetch('/api/v1/admin/commission/ledger', {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch commission ledger data');
      }
      return response.json();
    }
  });
};

// --- WhatsApp Log Hooks ---

export const useWhatsAppLog = (page: number = 1) => {
  return useQuery({
    queryKey: ['whatsapp-log', page],
    queryFn: async () => {
      const response = await fetch(`/api/v1/admin/whatsapp?page=${page}`, {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch WhatsApp log data');
      }
      return response.json();
    }
  });
};

// --- Merchant Integration Hooks ---

export const useIntegrationDetails = () => {
  return useQuery({
    queryKey: ['integration-details'],
    queryFn: async () => {
      // The API Gateway will derive client_id from the JWT token.
      const response = await fetch('/api/v1/merchant/integration', {
        headers: {
          'x-api-key': 'admin_test_key' // This key might need to be different for merchant roles
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch integration details');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // Stale after 1 hour
  });
};

// Admin hooks
export const useMerchants = () => {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: apiService.getMerchants,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}; 