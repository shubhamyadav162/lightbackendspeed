import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useGateways = () => {
  const queryClient = useQueryClient();

  // Fetch list of gateways
  const gatewaysQuery = useQuery({
    queryKey: ['gateways'],
    queryFn: apiService.getGateways,
  });

  // Create gateway
  const createGateway = useMutation({
    mutationFn: apiService.createGateway,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gateways'] }),
  });

  // Update gateway
  const updateGateway = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => apiService.updateGateway(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gateways'] }),
  });

  // Delete gateway
  const deleteGateway = useMutation({
    mutationFn: (id: string) => apiService.deleteGateway(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gateways'] }),
  });

  return {
    gateways: gatewaysQuery.data || [],
    isLoading: gatewaysQuery.isLoading,
    error: gatewaysQuery.error,
    refetch: gatewaysQuery.refetch,
    createGateway: createGateway.mutateAsync,
    updateGateway: updateGateway.mutateAsync,
    deleteGateway: deleteGateway.mutateAsync,
  };
}; 