import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// This would be configured to point to your deployed api-gateway function
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/admin'; 
const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY || 'your-admin-api-key'; // Replace with a secure key

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ADMIN_API_KEY,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || 'An unknown error occurred');
    }

    return response.json();
};

// Hook to get all payment gateways
export const useGateways = () => 
  useQuery({
    queryKey: ['gateways'], 
    queryFn: () => apiFetch('/gateways')
  });

// Hook to update a gateway (e.g., toggle active status)
export const useUpdateGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: Record<string, unknown> }) => 
      apiFetch(`/gateways/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Gateway updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    },
    onError: (error: Error) => {
        toast.error(`Failed to update gateway: ${error.message}`);
    }
  });
};

// Hook to get real-time queue metrics
export const useQueueMetrics = () =>
  useQuery({
    queryKey: ['queue-metrics'], 
    queryFn: () => apiFetch('/queues'),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

// Hook to get commission ledger data
export const useCommissionData = () =>
  useQuery({
    queryKey: ['commission'], 
    queryFn: () => apiFetch('/commission/ledger')
  });

// Hook to get WhatsApp notification logs with pagination
export const useWhatsAppLog = (page = 1) =>
  useQuery({
    queryKey: ['whatsapp-log', page], 
    queryFn: () => apiFetch(`/whatsapp?page=${page}`),
    placeholderData: (previousData) => previousData,
  });

// Hook to get WhatsApp usage for a specific merchant
export const useWhatsAppUsage = (clientId: string) =>
  useQuery({
    queryKey: ['whatsapp-usage', clientId],
    queryFn: () => apiFetch(`/merchant/whatsapp/usage?client_id=${clientId}`),
    enabled: !!clientId, // Only run query if clientId is provided
  }); 