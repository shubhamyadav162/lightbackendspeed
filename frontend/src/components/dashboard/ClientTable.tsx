
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Settings, MessageSquare, Key, Search } from 'lucide-react';
import { Client, ClientStatus, NotificationType } from '@/types/client';

interface ClientTableProps {
  filteredClients: Client[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  toggleNotification: (clientId: string, type: NotificationType) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
  regenerateApiKey: (clientId: string) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  filteredClients,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  toggleNotification,
  updateClientStatus,
  regenerateApiKey
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Client Directory</CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Notifications</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.company}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{client.email}</p>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={client.status} 
                    onValueChange={(value: ClientStatus) => 
                      updateClientStatus(client.id, value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">${client.totalVolume.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {client.totalTransactions} transactions
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(client.currentMonthVolume / client.monthlyLimit) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${client.currentMonthVolume.toLocaleString()} / ${client.monthlyLimit.toLocaleString()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3 h-3" />
                      <Switch 
                        checked={client.whatsappNotifications}
                        onCheckedChange={() => toggleNotification(client.id, 'whatsapp')}
                      />
                      <span className="text-xs">WhatsApp</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 text-center">@</span>
                      <Switch 
                        checked={client.emailNotifications}
                        onCheckedChange={() => toggleNotification(client.id, 'email')}
                      />
                      <span className="text-xs">Email</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{client.lastActivity}</span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => regenerateApiKey(client.id)}
                    >
                      <Key className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
