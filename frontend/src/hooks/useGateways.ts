import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useGateways = () => {
  const queryClient = useQueryClient();

  // Fetch list of gateways
  const gatewaysQuery = useQuery(['gateways'], apiService.getGateways);

  // Create gateway
  const createGateway = useMutation(apiService.createGateway, {
    onSuccess: () => queryClient.invalidateQueries(['gateways']),
  });

  // Update gateway
  const updateGateway = useMutation(
    ({ id, updates }: { id: string; updates: any }) => apiService.updateGateway(id, updates),
    {
      onSuccess: () => queryClient.invalidateQueries(['gateways']),
    },
  );

  // Delete gateway
  const deleteGateway = useMutation((id: string) => apiService.deleteGateway(id), {
    onSuccess: () => queryClient.invalidateQueries(['gateways']),
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