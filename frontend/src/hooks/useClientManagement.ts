import { useState, useEffect } from 'react';
import { Client, ClientStatus, NotificationType } from '@/types/client';

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
        const response = await fetch('/api/v1/admin/clients', {
          headers: {
            'x-api-key': 'admin_test_key',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        } else {
          console.error('Failed to fetch clients:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
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
