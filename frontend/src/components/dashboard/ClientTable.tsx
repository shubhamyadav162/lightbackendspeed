
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Settings, MessageSquare, Key, Search, IndianRupee, AlertTriangle, Send } from 'lucide-react';
import { Client, ClientStatus, NotificationType } from '@/types/client';
import { toast } from 'sonner';

interface ClientTableProps {
  filteredClients: Client[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  toggleNotification: (clientId: string, type: NotificationType) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
  regenerateApiKey: (clientId: string) => void;
  onClientClick?: (clientId: string) => void;
  sendWhatsApp?: (clientId: string, type: string) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  filteredClients,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  toggleNotification,
  updateClientStatus,
  regenerateApiKey,
  onClientClick,
  sendWhatsApp
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const isLowBalance = (client: Client) => {
    return (client.balance_due || 0) >= (client.warn_threshold || 10000);
  };

  const handleSendWhatsApp = async (clientId: string, type: string) => {
    try {
      await sendWhatsApp?.(clientId, type);
      toast.success('WhatsApp message sent successfully!');
    } catch (error) {
      toast.error('Failed to send WhatsApp message');
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
              <TableHead>Commission</TableHead>
              <TableHead>Balance Due</TableHead>
              <TableHead>Integration</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onClientClick?.(client.id)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-blue-600 hover:text-blue-800">{client.name}</p>
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
                    <p className="font-medium">₹{(client.totalVolume / 100000).toFixed(1)}L</p>
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
                      ₹{(client.currentMonthVolume / 100000).toFixed(1)}L / ₹{(client.monthlyLimit / 100000).toFixed(1)}L
                    </p>
                  </div>
                </TableCell>
                
                {/* Commission Column */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <IndianRupee className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-600">{client.fee_percent || 3.5}%</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Earned: {formatCurrency(client.commission_earned || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rate: {formatCurrency((client.totalVolume || 0) * (client.fee_percent || 3.5) / 100)} total
                    </p>
                  </div>
                </TableCell>

                {/* Balance Due Column */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      {isLowBalance(client) && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      <span className={`font-medium ${isLowBalance(client) ? 'text-red-600' : 'text-orange-600'}`}>
                        {formatCurrency(client.balance_due || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Threshold: {formatCurrency(client.warn_threshold || 10000)}
                    </p>
                    {isLowBalance(client) && (
                      <Badge variant="destructive" className="text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Key-Salt Wrapper
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">20+ Gateways</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-600">4 Active</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="link" 
                      className="p-0 h-auto text-xs text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClientClick?.(client.id);
                      }}
                    >
                      View Credentials →
                    </Button>
                  </div>
                </TableCell>
                {/* WhatsApp Column */}
                <TableCell>
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-1">
                      <Switch 
                        checked={client.whatsappNotifications}
                        onCheckedChange={() => toggleNotification(client.id, 'whatsapp')}
                        size="sm"
                      />
                      <span className="text-xs">Auto</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleSendWhatsApp(client.id, 'LOW_BALANCE')}
                        disabled={!isLowBalance(client)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Alert
                      </Button>
                      <Button
                        size="sm"
                        variant="outline" 
                        className="h-6 px-2 text-xs"
                        onClick={() => handleSendWhatsApp(client.id, 'PAYMENT_REMINDER')}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Remind
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onClientClick?.(client.id)}
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" title="Settings">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => regenerateApiKey(client.id)}
                      title="Regenerate API Key"
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
