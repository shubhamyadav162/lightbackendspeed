import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useQueueActions = () => {
  const queryClient = useQueryClient();

  // Fetch queue stats
  const statsQuery = useQuery({
    queryKey: ['queues', 'stats'],
    queryFn: apiService.getQueueStats,
    refetchInterval: 10_000, // poll every 10s as fallback to SSE
  });

  // Retry failed jobs
  const retryMutation = useMutation({
    mutationFn: (params: { queue?: string; jobIds?: string[]; delay?: number }) => apiService.retryQueueJobs(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues', 'stats'] }),
  });

  // Clean completed/old jobs
  const cleanMutation = useMutation({
    mutationFn: (payload: { queue?: string; olderThan?: string }) => apiService.cleanQueues(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues', 'stats'] }),
  });

  // Pause / Resume queue
  const pauseMutation = useMutation({
    mutationFn: (params: { queue: string; pause: boolean }) => apiService.pauseQueue(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues', 'stats'] }),
  });

  return {
    stats: statsQuery.data || [],
    isLoadingStats: statsQuery.isLoading,
    retryJobs: retryMutation.mutateAsync,
    cleanQueue: cleanMutation.mutateAsync,
    pauseQueue: pauseMutation.mutateAsync,
  };
}; 