import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { useClientManagement } from '@/hooks/useClientManagement';
import { ClientOverviewCards } from './ClientOverviewCards';
import { ClientTable } from './ClientTable';
import { ClientApiKeySection } from './ClientApiKeySection';
import { AddClientModal } from './AddClientModal';
import { KeySaltWrapperInfo } from './KeySaltWrapperInfo';

interface ClientManagementProps {
  onClientSelect?: (clientId: string) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ onClientSelect }) => {
  const navigate = useNavigate();
  const {
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    toggleNotification,
    updateClientStatus,
    regenerateApiKey,
  } = useClientManagement();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const handleAddClientSuccess = () => {
    // Refresh clients list - this would be handled by React Query invalidation in real app
    window.location.reload();
  };

  const handleClientClick = (clientId: string) => {
    if (onClientSelect) {
      onClientSelect(clientId);
    } else {
      navigate(`/dashboard/admin/clients/${clientId}`);
    }
  };

  const handleSendWhatsApp = async (clientId: string, type: string) => {
    try {
      const response = await fetch(`/api/v1/admin/clients/${clientId}/notifications`, {
        method: 'POST',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          template: type === 'LOW_BALANCE' ? 'low_balance_alert' : 'payment_reminder',
          send_whatsapp: true,
          send_email: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message');
      }
      
      // The success toast will be shown by the ClientTable component
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error; // Re-throw to be caught by ClientTable
    }
  };

  // Enhanced statistics
  const totalRevenue = clients.reduce((sum, client) => sum + (client.totalVolume || 0), 0);
  const activeClients = clients.filter(client => client.status === 'active').length;
  const totalTransactions = clients.reduce((sum, client) => sum + (client.totalTransactions || 0), 0);
  const totalCommissionDue = clients.reduce((sum, client) => sum + (client.balance_due || 0), 0);
  const lowBalanceClients = clients.filter(client => (client.balance_due || 0) >= (client.warn_threshold || 10000)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage up to 500 clients with LightSpeedPay's <strong>Key-Salt Wrapper</strong> system. 
            Each client gets single credentials that route to <strong>20+ payment gateways</strong> automatically.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
                <p className="text-xs text-green-600">Active: {activeClients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{(totalRevenue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-600">{totalTransactions} transactions</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Key-Salt Wrappers</p>
                <p className="text-2xl font-bold text-purple-600">{clients.length}</p>
                <p className="text-xs text-gray-600">20+ gateways each</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission Due</p>
                <p className="text-2xl font-bold text-orange-600">₹{(totalCommissionDue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-600">{lowBalanceClients} need payment</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddClientSuccess}
      />

      <ClientOverviewCards clients={clients} />

      <KeySaltWrapperInfo />

      <ClientTable
        filteredClients={filteredClients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        toggleNotification={toggleNotification}
        updateClientStatus={updateClientStatus}
        regenerateApiKey={regenerateApiKey}
        onClientClick={handleClientClick}
        sendWhatsApp={handleSendWhatsApp}
      />

      <ClientApiKeySection
        filteredClients={filteredClients}
        regenerateApiKey={regenerateApiKey}
      />
    </div>
  );
};
