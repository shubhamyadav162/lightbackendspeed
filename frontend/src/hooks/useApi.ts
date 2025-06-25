import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, subscribeToTransactions, subscribeToAlerts, subscribeToAuditLogs } from '../services/api';
import { useEffect } from 'react';

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
    onSuccess: () => {
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
    },
  });
};

// Transaction Management Hooks
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return query;
};

// Wallet Management Hooks
export const useWallets = () => {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: apiService.getWallets,
    refetchInterval: 15000, // Refetch every 15 seconds
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

// Queue Monitoring Hooks
export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: apiService.getQueueStats,
    refetchInterval: 5000, // Refetch every 5 seconds
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-credentials'] });
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