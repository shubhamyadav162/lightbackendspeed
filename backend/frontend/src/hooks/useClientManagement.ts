import { useState, useEffect } from 'react';
import { Client, ClientStatus, NotificationType } from '@/types/client';

// Demo client data for testing purposes
const DEMO_RAMLAL_CLIENT: Client = {
  id: 'demo-ramlal-client-2024',
  name: 'Ramlal Gupta',
  company: 'Ramlal Electronics & Digital Payments',
  email: 'ramlal.gupta@lightspeedpay.com',
  phone: '+91-9876543210',
  apiKey: 'lsp_live_demo_ramlal_4xA9dKj7mN8qP2wE3zR5tY6uI0oB1cF4G',
  client_key: 'lsp_live_demo_ramlal_4xA9dKj7mN8qP2wE3zR5tY6uI0oB1cF4G',
  client_salt: 'ramlal_salt_8F3kL9mX2nQ5tW7yZ1bV4cD6eG0hJ8iK',
  webhook_url: 'https://ramlal-electronics.com/webhooks/lightspeedpay',
  status: 'active' as const,
  totalTransactions: 15847,
  totalVolume: 89543200, // ₹8.95 Lakh
  lastActivity: '2024-01-15T10:30:00Z',
  whatsappNotifications: true,
  emailNotifications: true,
  monthlyLimit: 50000000, // ₹50 Lakh limit
  currentMonthVolume: 12458760, // ₹12.46 Lakh this month
  // Commission & Financial Fields
  fee_percent: 3.2, // 3.2% commission rate
  balance_due: 286978, // ₹2,869.78 due in paisa
  warn_threshold: 500000, // ₹5,000 warning threshold
  commission_earned: 2865784, // ₹28,657.84 total earned
  last_payout: '2024-01-01T00:00:00Z',
  last_payout_amount: 1874590 // ₹18,745.90 last payout
};

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Fetch clients from API on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        // Always start with demo client for testing
        let allClients = [DEMO_RAMLAL_CLIENT];

        // Try to fetch additional clients from API (optional)
        try {
          const response = await fetch('/api/v1/admin/clients', {
            headers: {
              'x-api-key': 'admin_test_key',
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const apiClients = data.clients || [];
            allClients = [DEMO_RAMLAL_CLIENT, ...apiClients];
          } else {
            // Silent fallback to demo data - API endpoint not available in development
          }
        } catch (apiError) {
          // Silent fallback to demo data - API endpoint not accessible
        }

        setClients(allClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Always ensure demo client is available
        setClients([DEMO_RAMLAL_CLIENT]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const toggleNotification = (clientId: string, type: NotificationType) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            [type === 'whatsapp' ? 'whatsappNotifications' : 'emailNotifications']: 
              !client[type === 'whatsapp' ? 'whatsappNotifications' : 'emailNotifications']
          }
        : client
    ));
  };

  const updateClientStatus = (clientId: string, status: ClientStatus) => {
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, status } : client
    ));
  };

  const regenerateApiKey = async (clientId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/clients/${clientId}/credentials/regenerate`, {
        method: 'POST',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(prev => prev.map(client => 
          client.id === clientId ? { ...client, apiKey: data.client_key } : client
        ));
        alert('API key regenerated successfully!');
      } else {
        alert('Failed to regenerate API key');
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
      alert('Error regenerating API key');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return {
    clients,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredClients,
    toggleNotification,
    updateClientStatus,
    regenerateApiKey
  };
};
