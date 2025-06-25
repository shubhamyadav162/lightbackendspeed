
import { useState } from 'react';
import { Client, ClientStatus, NotificationType } from '@/types/client';

const initialClients: Client[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'ShopCorp Inc.',
    email: 'john@shopcorp.com',
    phone: '+1-555-0123',
    apiKey: 'sk_live_abc123...',
    status: 'active',
    totalTransactions: 1250,
    totalVolume: 125000,
    lastActivity: '2024-06-10 16:30',
    whatsappNotifications: true,
    emailNotifications: true,
    monthlyLimit: 50000,
    currentMonthVolume: 32500
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'TechStart Solutions',
    email: 'sarah@techstart.io',
    phone: '+1-555-0456',
    apiKey: 'sk_live_def456...',
    status: 'active',
    totalTransactions: 890,
    totalVolume: 89500,
    lastActivity: '2024-06-10 14:15',
    whatsappNotifications: false,
    emailNotifications: true,
    monthlyLimit: 30000,
    currentMonthVolume: 18900
  },
  {
    id: '3',
    name: 'Mike Wilson',
    company: 'RetailPro Ltd.',
    email: 'mike@retailpro.com',
    phone: '+1-555-0789',
    apiKey: 'sk_live_ghi789...',
    status: 'suspended',
    totalTransactions: 2340,
    totalVolume: 234000,
    lastActivity: '2024-06-08 10:45',
    whatsappNotifications: true,
    emailNotifications: false,
    monthlyLimit: 100000,
    currentMonthVolume: 45600
  }
];

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const regenerateApiKey = (clientId: string) => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}...`;
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, apiKey: newKey } : client
    ));
    alert('API key regenerated successfully!');
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return {
    clients,
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
