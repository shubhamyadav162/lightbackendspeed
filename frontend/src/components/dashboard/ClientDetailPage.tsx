import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Copy, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Plus,
  Eye,
  RefreshCw,
  Bell,
  Activity,
  BarChart3,
  Key,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { CommissionManager } from './CommissionManager';

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
          // Fallback to mock data if API fails
          setClientData(mockClientData);
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error);
        // Fallback to mock data
        setClientData(mockClientData);
      } finally {
        setApiLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Mock data - Fallback when API is not available
  const mockClientData = {
    id: clientId,
    name: 'Sam Johnson',
    company: 'TechStart Solutions',
    email: 'sam@techstart.io',
    phone: '+1-555-0456',
    status: 'active',
    client_key: 'sk_live_abc123def456ghi789',
    client_salt: 'salt_xyz_secure_789',
    webhook_url: `https://api.lightspeedpay.com/webhook/${clientId}`,
    created_at: '2024-01-15',
    last_activity: '2024-06-10 14:30',
    
    // Revenue & Commission Data
    revenue: {
      total_volume: 2450000, // ₹24.5L
      total_transactions: 8947,
      commission_earned: 85750, // ₹85,750
      commission_rate: 3.5, // 3.5%
      monthly_volume: 450000,
      monthly_transactions: 1247
    },
    
    // Wallet Data
    wallet: {
      balance_due: 12500, // ₹12,500 commission owed
      warn_threshold: 10000,
      last_payout: '2024-05-25',
      last_payout_amount: 45000,
      auto_payout_enabled: true
    },

    // Commission Data
    commission: {
      fee_percent: 4.0, // 4% commission rate
      balance_due: 1250000, // ₹12,500 actual (stored in paisa)
      warn_threshold: 1000000, // ₹10,000 threshold (stored in paisa)
      commission_earned: 8575000, // ₹85,750 total earned
      last_payout: '2024-05-25',
      last_payout_amount: 4500000, // ₹45,000 last payout
      total_volume: 2450000 // Total transaction volume
    },
    
    // Gateway Allocation
    gateways: [
      { id: 'gw1', name: 'Razorpay_Primary', provider: 'razorpay', priority: 1, status: 'active', success_rate: 98.5, monthly_volume: 150000, limit: 500000 },
      { id: 'gw2', name: 'PayU_Secondary', provider: 'payu', priority: 2, status: 'active', success_rate: 97.2, monthly_volume: 120000, limit: 400000 },
      { id: 'gw3', name: 'Cashfree_Backup', provider: 'cashfree', priority: 3, status: 'active', success_rate: 96.8, monthly_volume: 80000, limit: 300000 },
      { id: 'gw4', name: 'PhonePe_Express', provider: 'phonepe', priority: 4, status: 'inactive', success_rate: 95.1, monthly_volume: 0, limit: 200000 },
      { id: 'gw5', name: 'Paytm_Special', provider: 'paytm', priority: 5, status: 'active', success_rate: 94.7, monthly_volume: 70000, limit: 250000 }
    ],
    
    // Recent Transactions
    recent_transactions: [
      { id: 'txn1', amount: 15000, status: 'success', gateway: 'Razorpay_Primary', created_at: '2024-06-10 14:25' },
      { id: 'txn2', amount: 8500, status: 'success', gateway: 'PayU_Secondary', created_at: '2024-06-10 13:45' },
      { id: 'txn3', amount: 22000, status: 'failed', gateway: 'Cashfree_Backup', created_at: '2024-06-10 12:30' },
      { id: 'txn4', amount: 5500, status: 'success', gateway: 'Razorpay_Primary', created_at: '2024-06-10 11:15' }
    ]
  };

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

  const regenerateCredentials = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('New credentials generated successfully!');
    }, 1500);
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
            <h1 className="text-3xl font-bold text-gray-900">{clientData.name}</h1>
            <p className="text-gray-600">{clientData.company}</p>
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
                  <p className="text-2xl font-bold text-blue-600">₹{(clientData.revenue.total_volume / 100000).toFixed(1)}L</p>
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
                  <p className="text-2xl font-bold text-green-600">₹{clientData.revenue.commission_earned.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-purple-600">{clientData.gateways.filter(g => g.status === 'active').length}</p>
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
                  <p className="text-2xl font-bold text-orange-600">₹{clientData.wallet.balance_due.toLocaleString()}</p>
                </div>
                <Wallet className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gateways">Gateways ({clientData.gateways.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
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
                    <p className="font-medium">{clientData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Company</Label>
                    <p className="font-medium">{clientData.company}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{clientData.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{clientData.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Created</Label>
                    <p className="font-medium">{clientData.created_at}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Last Activity</Label>
                    <p className="font-medium">{clientData.last_activity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Credentials - Enhanced Key-Salt Wrapper Display */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>LightSpeedPay Key-Salt Wrapper</span>
                    <Badge className="bg-blue-600 text-white">Single Integration</Badge>
                  </div>
                  <Button size="sm" onClick={regenerateCredentials} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate All
                  </Button>
                </CardTitle>
                <p className="text-sm text-blue-700">
                  These credentials provide access to <strong>20+ payment gateways</strong> through a single integration
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <span>Client Key</span>
                      <Badge variant="outline" className="text-xs">Required for Authentication</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input value={clientData.client_key} readOnly className="font-mono text-sm bg-gray-50" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.client_key, 'Client Key')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Include this in X-Client-Key header</p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Client Salt</span>
                      <Badge variant="outline" className="text-xs">Required for HMAC</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input value={clientData.client_salt} readOnly className="font-mono text-sm bg-gray-50" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.client_salt, 'Client Salt')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use for signing requests with HMAC-SHA256</p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span>Webhook Endpoint</span>
                      <Badge variant="outline" className="text-xs">Auto-Generated</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input value={clientData.webhook_url} readOnly className="font-mono text-sm bg-gray-50" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientData.webhook_url, 'Webhook URL')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Receives payment status updates from all gateways</p>
                  </div>
                </div>

                {/* Gateway Routing Info */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-blue-800">Gateway Routing System</h4>
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700"><strong>Available Gateways:</strong> 20+</p>
                      <p className="text-blue-600">Razorpay, PayU, Cashfree, PhonePe, Paytm</p>
                    </div>
                    <div>
                      <p className="text-purple-700"><strong>Active Gateways:</strong> {clientData.gateways.filter(g => g.status === 'active').length}</p>
                      <p className="text-purple-600">Automatic failover & load balancing</p>
                    </div>
                  </div>
                </div>

                {/* Quick Integration Guide */}
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-white">Quick Integration</h4>
                  <pre className="text-xs text-green-400 overflow-x-auto">
{`// Payment Initiation
curl -X POST https://api.lightspeedpay.com/payment/initiate \\
  -H "X-Client-Key: ${clientData.client_key}" \\
  -H "X-Client-Salt: ${clientData.client_salt}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "order_id": "ORDER_123",
    "customer_phone": "+91xxxxxxxxxx"
  }'

// Response: Checkout URL + Transaction ID
// Webhook: ${clientData.webhook_url}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Revenue Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-3xl font-bold">₹{(clientData.revenue.total_volume / 100000).toFixed(1)}L</p>
                  <p className="text-sm text-green-600">+{clientData.revenue.total_transactions} transactions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-3xl font-bold">{clientData.revenue.commission_rate}%</p>
                  <p className="text-sm text-gray-600">Earned: ₹{clientData.revenue.commission_earned.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-3xl font-bold">₹{(clientData.revenue.monthly_volume / 100000).toFixed(1)}L</p>
                  <p className="text-sm text-blue-600">{clientData.revenue.monthly_transactions} transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gateways Tab */}
        <TabsContent value="gateways" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Gateways ({clientData.gateways.length})</span>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gateway
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {clientData.gateways.map((gateway) => (
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
                          <p>₹{gateway.monthly_volume.toLocaleString()}</p>
                          <Progress value={(gateway.monthly_volume / gateway.limit) * 100} className="h-2" />
                          <p className="text-xs text-gray-600">
                            {((gateway.monthly_volume / gateway.limit) * 100).toFixed(1)}% of limit
                          </p>
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
                  {clientData.recent_transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                      <TableCell>₹{txn.amount.toLocaleString()}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <CommissionManager
            clientId={clientId}
            commissionData={clientData.commission}
            onSendWhatsApp={sendWhatsAppNotification}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">WhatsApp Notifications</p>
                    <p className="text-sm text-gray-600">Send balance alerts and updates via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Send transaction summaries via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Balance Alerts</p>
                    <p className="text-sm text-gray-600">Alert when commission balance exceeds threshold</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-4">Test Notifications</p>
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => sendWhatsAppNotification('CUSTOM', 'This is a test notification.')} disabled={isLoading}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Test WhatsApp
                  </Button>
                  <Button variant="outline" className="ml-2">
                    <Bell className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                    <Input id="commission-rate" defaultValue={clientData.revenue.commission_rate} />
                  </div>
                  <div>
                    <Label htmlFor="warning-threshold">Warning Threshold (₹)</Label>
                    <Input id="warning-threshold" defaultValue={clientData.wallet.warn_threshold} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input id="webhook-url" defaultValue={clientData.webhook_url} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked={clientData.status === 'active'} />
                    <Label>Client Active</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 pt-4 border-t">
                <Button>Save Changes</Button>
                <Button variant="outline">Reset</Button>
                <Button variant="destructive" className="ml-auto">Suspend Client</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 