
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useClientManagement } from '@/hooks/useClientManagement';
import { ClientOverviewCards } from './ClientOverviewCards';
import { ClientTable } from './ClientTable';
import { ClientApiKeySection } from './ClientApiKeySection';

export const ClientManagement = () => {
  const {
    clients,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredClients,
    toggleNotification,
    updateClientStatus,
    regenerateApiKey
  } = useClientManagement();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage client accounts, API access, and notification preferences</p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

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
