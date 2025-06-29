import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Eye, Settings, Key, Shield, MessageSquare, Copy, RefreshCw,
  DollarSign, TrendingUp, CreditCard, Wallet, Plus, Activity, BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CommissionManager } from './CommissionManager';
import { DemoSetupButton } from './DemoSetupButton';

interface ClientDetailPageProps {
  clientId: string;
  onBack?: () => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ clientId, onBack }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(true);

  // Fetch client data on component mount
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setApiLoading(true);
        const response = await fetch(`/api/v1/admin/clients/${clientId}`, {
          headers: {
            'x-api-key': 'admin_test_key',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setClientData(data.client);
        } else {
          console.error('Failed to fetch client data:', response.statusText);
          toast.error('Failed to load client data');
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error);
        toast.error('Failed to load client data');
      } finally {
        setApiLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const sendWhatsAppNotification = async (type = 'LOW_BALANCE', message?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/clients/${clientId}/notifications`, {
        method: 'POST',
        headers: {
          'x-api-key': 'admin_test_key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          template: 'default_template',
          message,
          send_whatsapp: true,
          send_email: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'WhatsApp notification sent successfully!');
      } else {
        toast.error('Failed to send WhatsApp notification');
      }
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Failed to send WhatsApp notification');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateCredentials = async () => {
    setIsLoading(true);
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
        setClientData(prev => ({
          ...prev,
          client_key: data.client_key,
          client_salt: data.client_salt
        }));
        toast.success('New credentials generated successfully!');
      } else {
        toast.error('Failed to regenerate credentials');
      }
    } catch (error) {
      console.error('Error regenerating credentials:', error);
      toast.error('Failed to regenerate credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state while fetching data
  if (apiLoading || !clientData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no client data
  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
            <p className="text-gray-600 mb-4">The requested client could not be found.</p>
            <Button onClick={() => onBack ? onBack() : navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => onBack ? onBack() : navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{clientData.name || clientData.company_name}</h1>
            <p className="text-gray-600">{clientData.company || clientData.company_name}</p>
          </div>
          <Badge className={getStatusColor(clientData.status)}>
            {clientData.status}
          </Badge>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{((clientData.revenue?.total_volume || 0) / 100000).toFixed(1)}L
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission Earned</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(clientData.revenue?.commission_earned || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Gateways</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(clientData.gateways || []).filter(g => g.status === 'active').length}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Balance Due</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{((clientData.commission?.balance_due || 0) / 100).toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gateways">Gateways ({(clientData.gateways || []).length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="demo">Demo Data</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Client Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Name</Label>
                    <p className="font-medium">{clientData.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Company</Label>
                    <p className="font-medium">{clientData.company_name || clientData.company || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{clientData.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{clientData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Created</Label>
                    <p className="font-medium">{clientData.created_at || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Last Activity</Label>
                    <p className="font-medium">{clientData.last_activity || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Credentials */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>API Credentials</span>
                    <Badge className="bg-blue-600 text-white">Single Integration</Badge>
                  </div>
                  <Button size="sm" onClick={regenerateCredentials} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Client Key</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input value={clientData.client_key || ''} readOnly className="font-mono text-sm bg-gray-50" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.client_key || '', 'Client Key')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Client Salt</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input value={clientData.client_salt || ''} readOnly className="font-mono text-sm bg-gray-50" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.client_salt || '', 'Client Salt')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span>Webhook URL</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input value={clientData.webhook_url || ''} readOnly className="font-mono text-sm bg-gray-50" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.webhook_url || '', 'Webhook URL')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gateways Tab */}
        <TabsContent value="gateways" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Gateways ({(clientData.gateways || []).length})</span>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gateway
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(clientData.gateways || []).length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No gateways configured for this client</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Monthly Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clientData.gateways || []).map((gateway) => (
                      <TableRow key={gateway.id}>
                        <TableCell>
                          <Badge variant="outline">#{gateway.priority}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{gateway.name}</TableCell>
                        <TableCell>{gateway.provider}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(gateway.status)}>
                            {gateway.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{gateway.success_rate}%</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>₹{gateway.monthly_volume?.toLocaleString() || '0'}</p>
                            <Progress value={(gateway.monthly_volume || 0) / (gateway.limit || 1) * 100} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3" />
                            </Button>
                            <Switch checked={gateway.status === 'active'} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(clientData.recent_transactions || []).length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent transactions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clientData.recent_transactions || []).map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-mono">{txn.id}</TableCell>
                        <TableCell>₹{txn.amount?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(txn.status)}>
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{txn.gateway}</TableCell>
                        <TableCell>{txn.created_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Data Tab */}
        <TabsContent value="demo" className="space-y-6">
          <DemoSetupButton />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Round-Robin Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">How to Test:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>1. **Setup Demo Data** - Click the button above to add 5 demo clients</li>
                    <li>2. **View Rotation Manager** - Navigate to each client to see rotation controls</li>
                    <li>3. **Test Round-Robin** - Use manual advance/reset buttons to see rotation</li>
                    <li>4. **Monitor Analytics** - Check distribution quality and metrics</li>
                    <li>5. **Gateway Assignment** - Use drag & drop to change rotation order</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Demo Clients Include:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
                    <div>• **Gaming World India** - 5 गेटवेज (Round-Robin)</div>
                    <div>• **ShopKart Online** - 3 गेटवेज (Round-Robin)</div>
                    <div>• **MoneyFlow Fintech** - 4 गेटवेज (Round-Robin)</div>
                    <div>• **EduTech Learning** - 2 गेटवेज (Priority Mode)</div>
                    <div>• **TravelEasy Booking** - 3 गेटवेज (Smart Mode)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <CommissionManager clientId={clientId} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>WhatsApp Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => sendWhatsAppNotification('LOW_BALANCE')} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Send Low Balance Alert
                </Button>
                <Button 
                  onClick={() => sendWhatsAppNotification('PAYMENT_REMINDER')} 
                  disabled={isLoading}
                  variant="outline"
                >
                  Send Payment Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Client Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Commission Rate</Label>
                    <p className="text-sm text-gray-600">Current rate: {clientData.commission?.fee_percent || 0}%</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto Payout</Label>
                    <p className="text-sm text-gray-600">Automatic commission payouts</p>
                  </div>
                  <Switch checked={clientData.commission?.auto_payout_enabled || false} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-gray-600">Client account status</p>
                  </div>
                  <Badge className={getStatusColor(clientData.status)}>
                    {clientData.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 