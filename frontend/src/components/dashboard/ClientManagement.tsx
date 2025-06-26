import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useClientManagement } from '@/hooks/useClientManagement';
import { ClientOverviewCards } from './ClientOverviewCards';
import { ClientTable } from './ClientTable';
import { ClientApiKeySection } from './ClientApiKeySection';
import { AddClientModal } from './AddClientModal';

export const ClientManagement = () => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">Manage your merchant clients and their settings</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddClientSuccess}
      />

      <ClientOverviewCards clients={clients} />

      <ClientTable
        filteredClients={filteredClients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        toggleNotification={toggleNotification}
        updateClientStatus={updateClientStatus}
        regenerateApiKey={regenerateApiKey}
      />

      <ClientApiKeySection
        filteredClients={filteredClients}
        regenerateApiKey={regenerateApiKey}
      />
    </div>
  );
};
