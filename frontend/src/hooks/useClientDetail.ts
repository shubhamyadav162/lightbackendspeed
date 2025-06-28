import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ClientDetail {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  client_key: string;
  client_salt: string;
  webhook_url: string;
  created_at: string;
  last_activity: string;
  revenue: {
    total_volume: number;
    total_transactions: number;
    commission_earned: number;
    commission_rate: number;
    monthly_volume: number;
    monthly_transactions: number;
    success_rate: number;
  };
  wallet: {
    balance_due: number;
    warn_threshold: number;
    last_payout: string;
    last_payout_amount: number;
    auto_payout_enabled: boolean;
  };
  gateways: Array<{
    id: string;
    name: string;
    provider: string;
    priority: number;
    status: string;
    success_rate: number;
    monthly_volume: number;
    limit: number;
  }>;
  recent_transactions: Array<{
    id: string;
    order_id: string;
    amount: number;
    status: string;
    gateway: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    template: string;
    type: string;
    status: string;
    sent_at?: string;
    error?: string;
    created_at: string;
  }>;
}

// API functions
const fetchClientDetail = async (clientId: string): Promise<ClientDetail> => {
  const response = await fetch(`/api/v1/admin/clients/${clientId}`, {
    headers: {
      'x-api-key': 'admin_test_key',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client details');
  }

  const data = await response.json();
  return data.client;
};

const updateClient = async (clientId: string, updates: Partial<ClientDetail>) => {
  const response = await fetch(`/api/v1/admin/clients/${clientId}`, {
    method: 'PUT',
    headers: {
      'x-api-key': 'admin_test_key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update client');
  }

  return response.json();
};

const sendNotification = async (
  clientId: string, 
  notificationData: {
    type: string;
    template?: string;
    message?: string;
    send_whatsapp?: boolean;
    send_email?: boolean;
  }
) => {
  const response = await fetch(`/api/v1/admin/clients/${clientId}/notifications`, {
    method: 'POST',
    headers: {
      'x-api-key': 'admin_test_key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notificationData),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }

  return response.json();
};

// Main hook
export const useClientDetail = (clientId: string) => {
  const queryClient = useQueryClient();

  // Fetch client details
  const {
    data: client,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: () => fetchClientDetail(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (updates: Partial<ClientDetail>) => updateClient(clientId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: (notificationData: {
      type: string;
      template?: string;
      message?: string;
      send_whatsapp?: boolean;
      send_email?: boolean;
    }) => sendNotification(clientId, notificationData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      toast.success(data.message || 'Notification sent successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
  });

  return {
    // Data
    client,
    isLoading,
    error,
    
    // Actions
    refetch,
    updateClient: updateClientMutation.mutate,
    isUpdating: updateClientMutation.isPending,
    
    sendNotification: sendNotificationMutation.mutate,
    isSendingNotification: sendNotificationMutation.isPending,
    
    // Helper functions
    sendLowBalanceAlert: () => {
      sendNotificationMutation.mutate({
        type: 'LOW_BALANCE',
        template: 'low_balance_alert',
        send_whatsapp: true,
        send_email: false,
      });
    },
    
    sendPaymentReminder: (message?: string) => {
      sendNotificationMutation.mutate({
        type: 'PAYMENT_REMINDER',
        template: 'payment_reminder',
        message,
        send_whatsapp: true,
        send_email: true,
      });
    },
    
    regenerateCredentials: () => {
      // This would typically generate new credentials
      updateClientMutation.mutate({
        // In real implementation, this would trigger credential regeneration on backend
        updated_at: new Date().toISOString(),
      });
    },
  };
}; 