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

// Demo client detail data for Ramlal
const DEMO_RAMLAL_DETAIL: ClientDetail = {
  id: 'demo-ramlal-client-2024',
  name: 'Ramlal Gupta',
  company: 'Ramlal Electronics & Digital Payments',
  email: 'ramlal.gupta@lightspeedpay.com',
  phone: '+91-9876543210',
  status: 'active',
  client_key: 'lsp_live_demo_ramlal_4xA9dKj7mN8qP2wE3zR5tY6uI0oB1cF4G',
  client_salt: 'ramlal_salt_8F3kL9mX2nQ5tW7yZ1bV4cD6eG0hJ8iK',
  webhook_url: 'https://ramlal-electronics.com/webhooks/lightspeedpay',
  created_at: '2024-01-01T00:00:00Z',
  last_activity: '2024-01-15T10:30:00Z',
  revenue: {
    total_volume: 89543200,
    total_transactions: 15847,
    commission_earned: 2865784,
    commission_rate: 3.2,
    monthly_volume: 12458760,
    monthly_transactions: 1247,
    success_rate: 97.8
  },
  wallet: {
    balance_due: 286978,
    warn_threshold: 500000,
    last_payout: '2024-01-01T00:00:00Z',
    last_payout_amount: 1874590,
    auto_payout_enabled: false
  },
  gateways: [
    {
      id: 'gw-razorpay-demo',
      name: 'Razorpay Standard',
      provider: 'razorpay',
      priority: 1,
      status: 'active',
      success_rate: 98.5,
      monthly_volume: 1247860,
      limit: 5000000
    },
    {
      id: 'gw-payu-demo',
      name: 'PayU Money',
      provider: 'payu',
      priority: 2,
      status: 'active',
      success_rate: 96.8,
      monthly_volume: 867453,
      limit: 3000000
    },
    {
      id: 'gw-ccavenue-demo',
      name: 'CCAvenue Gateway',
      provider: 'ccavenue',
      priority: 3,
      status: 'active',
      success_rate: 94.2,
      monthly_volume: 567892,
      limit: 2500000
    },
    {
      id: 'gw-phonepe-demo',
      name: 'PhonePe Switch',
      provider: 'phonepe',
      priority: 4,
      status: 'active',
      success_rate: 97.1,
      monthly_volume: 1156745,
      limit: 4000000
    },
    {
      id: 'gw-paytm-demo',
      name: 'Paytm Payment Gateway',
      provider: 'paytm',
      priority: 5,
      status: 'inactive',
      success_rate: 95.7,
      monthly_volume: 0,
      limit: 3500000
    },
    {
      id: 'gw-instamojo-demo',
      name: 'Instamojo',
      provider: 'instamojo',
      priority: 6,
      status: 'active',
      success_rate: 93.8,
      monthly_volume: 445672,
      limit: 2000000
    },
    {
      id: 'gw-billdesk-demo',
      name: 'BillDesk Payment',
      provider: 'billdesk',
      priority: 7,
      status: 'maintenance',
      success_rate: 92.4,
      monthly_volume: 234567,
      limit: 1800000
    },
    {
      id: 'gw-cashfree-demo',
      name: 'Cashfree Payments',
      provider: 'cashfree',
      priority: 8,
      status: 'active',
      success_rate: 96.3,
      monthly_volume: 678934,
      limit: 3200000
    }
  ],
  recent_transactions: [
    {
      id: 'txn_ramlal_001',
      order_id: 'ORD_2024_001',
      amount: 25000,
      status: 'success',
      gateway: 'Razorpay Standard',
      created_at: '2024-01-15T09:30:00Z'
    },
    {
      id: 'txn_ramlal_002', 
      order_id: 'ORD_2024_002',
      amount: 18500,
      status: 'success',
      gateway: 'PayU Money',
      created_at: '2024-01-15T08:45:00Z'
    },
    {
      id: 'txn_ramlal_003',
      order_id: 'ORD_2024_003',
      amount: 45000,
      status: 'failed',
      gateway: 'BillDesk Payment',
      created_at: '2024-01-15T07:20:00Z'
    }
  ],
  notifications: [
    {
      id: 'notif_001',
      template: 'low_balance_alert',
      type: 'LOW_BALANCE',
      status: 'sent',
      sent_at: '2024-01-14T10:00:00Z',
      created_at: '2024-01-14T10:00:00Z'
    },
    {
      id: 'notif_002',
      template: 'payment_reminder',
      type: 'PAYMENT_REMINDER',
      status: 'sent',
      sent_at: '2024-01-13T15:30:00Z',
      created_at: '2024-01-13T15:30:00Z'
    }
  ]
};

// API functions
const fetchClientDetail = async (clientId: string): Promise<ClientDetail> => {
  // Return demo data for Ramlal client
  if (clientId === 'demo-ramlal-client-2024') {
    return DEMO_RAMLAL_DETAIL;
  }

  // Try to fetch from API for other clients
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
        last_activity: new Date().toISOString(),
      });
    },
  };
}; 