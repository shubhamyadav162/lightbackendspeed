
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Building, DollarSign, Eye } from 'lucide-react';
import { Client } from '@/types/client';

interface ClientOverviewCardsProps {
  clients: Client[];
}

export const ClientOverviewCards: React.FC<ClientOverviewCardsProps> = ({ clients }) => {
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalVolume = clients.reduce((sum, c) => sum + c.totalVolume, 0);
  const avgTransactions = Math.round(clients.reduce((sum, c) => sum + c.totalTransactions, 0) / clients.length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-green-600">{activeClients}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-purple-600">
                ${totalVolume.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Transactions</p>
              <p className="text-2xl font-bold text-orange-600">{avgTransactions}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
