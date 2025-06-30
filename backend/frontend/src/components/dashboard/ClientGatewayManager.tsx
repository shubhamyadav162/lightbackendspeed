import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Copy, 
  Eye, 
  EyeOff, 
  Settings, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService, subscribeToGatewayHealth } from '@/services/api';
import { GatewayConfigurationModal } from './GatewayConfigurationModal';
import { useClientGatewayAssignments } from '@/hooks/useClientGatewayAssignments';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  priority: number;
  status: 'active' | 'inactive' | 'maintenance';
  success_rate: number;
  monthly_volume: number;
  limit: number;
  response_time: number;
  is_active?: boolean;
  api_key?: string;
  api_secret?: string;
  daily_usage?: number;
  daily_limit?: number;
}

// Demo gateway data for Ramlal client
const DEMO_RAMLAL_GATEWAYS: Gateway[] = [
  {
    id: 'gw-razorpay-demo',
    name: 'Razorpay Standard',
    provider: 'razorpay',
    priority: 1,
    status: 'active',
    success_rate: 98.5,
    monthly_volume: 1247860,
    limit: 5000000,
    response_time: 245,
    is_active: true,
    api_key: 'rzp_live_4xA9dKj7mN8qP2wE',
    api_secret: 'rzp_secret_3zR5tY6uI0oB1cF4',
    daily_usage: 45600,
    daily_limit: 200000
  },
  {
    id: 'gw-payu-demo',
    name: 'PayU Money',
    provider: 'payu',
    priority: 2,
    status: 'active',
    success_rate: 96.8,
    monthly_volume: 867453,
    limit: 3000000,
    response_time: 320,
    is_active: true,
    api_key: 'payu_live_8F3kL9mX2nQ5tW7y',
    api_secret: 'payu_secret_Z1bV4cD6eG0hJ8iK',
    daily_usage: 28900,
    daily_limit: 120000
  },
  {
    id: 'gw-ccavenue-demo',
    name: 'CCAvenue Gateway',
    provider: 'ccavenue',
    priority: 3,
    status: 'active',
    success_rate: 94.2,
    monthly_volume: 567892,
    limit: 2500000,
    response_time: 410,
    is_active: true,
    api_key: 'ccav_live_2S9fX7bK4mL6pN8q',
    api_secret: 'ccav_secret_R3tV5wY8zA1cE4fG',
    daily_usage: 19800,
    daily_limit: 90000
  },
  {
    id: 'gw-phonepe-demo',
    name: 'PhonePe Switch',
    provider: 'phonepe',
    priority: 4,
    status: 'active',
    success_rate: 97.1,
    monthly_volume: 1156745,
    limit: 4000000,
    response_time: 280,
    is_active: true,
    api_key: 'phonepe_live_H7jI9kL2mN5pQ8r',
    api_secret: 'phonepe_secret_S4tV6wX9yA2bD5eF',
    daily_usage: 38900,
    daily_limit: 150000
  },
  {
    id: 'gw-paytm-demo',
    name: 'Paytm Payment Gateway',
    provider: 'paytm',
    priority: 5,
    status: 'inactive',
    success_rate: 95.7,
    monthly_volume: 0,
    limit: 3500000,
    response_time: 355,
    is_active: false, // Disabled for demo
    api_key: 'paytm_live_G8hJ0kM3nP6qR9s',
    api_secret: 'paytm_secret_T5uW7xZ0yB3cF6gH',
    daily_usage: 0,
    daily_limit: 130000
  },
  {
    id: 'gw-instamojo-demo',
    name: 'Instamojo',
    provider: 'instamojo',
    priority: 6,
    status: 'active',
    success_rate: 93.8,
    monthly_volume: 445672,
    limit: 2000000,
    response_time: 445,
    is_active: true,
    api_key: 'insta_live_I9jK1lN4oQ7rS0t',
    api_secret: 'insta_secret_U6vX8yB1cE4fH7gI',
    daily_usage: 15600,
    daily_limit: 70000
  },
  {
    id: 'gw-billdesk-demo',
    name: 'BillDesk Payment',
    provider: 'billdesk',
    priority: 7,
    status: 'maintenance',
    success_rate: 92.4,
    monthly_volume: 234567,
    limit: 1800000,
    response_time: 6200, // Slow response time
    is_active: true,
    api_key: 'billdesk_live_J0kM2nP5qS8tV1w',
    api_secret: 'billdesk_secret_X7zA0cF3gI6jK9lM',
    daily_usage: 8900,
    daily_limit: 60000
  },
  {
    id: 'gw-cashfree-demo',
    name: 'Cashfree Payments',
    provider: 'cashfree',
    priority: 8,
    status: 'active',
    success_rate: 96.3,
    monthly_volume: 678934,
    limit: 3200000,
    response_time: 298,
    is_active: true,
    api_key: 'cashfree_live_K1lN3oQ6rU9tX2y',
    api_secret: 'cashfree_secret_Y8zA1cF4gI7jM0nP',
    daily_usage: 24500,
    daily_limit: 110000
  }
];

interface ClientGatewayManagerProps {
  clientId: string;
  clientData: {
    client_key: string;
    client_salt: string;
    gateways: Gateway[];
  };
  onGatewayUpdate?: () => void;
}

export const ClientGatewayManager: React.FC<ClientGatewayManagerProps> = ({ 
  clientId, 
  clientData, 
  onGatewayUpdate 
}) => {
  // Use real gateway assignment data
  const { 
    gateways, 
    assignments, 
    loading: assignmentsLoading, 
    error, 
    refetch: refetchAssignments,
    updateAssignment 
  } = useClientGatewayAssignments(clientId);

  // Fallback to demo data if no real assignments and it's demo client
  const effectiveGateways = gateways.length > 0 
    ? gateways 
    : (clientId === 'demo-ramlal-client-2024' ? DEMO_RAMLAL_GATEWAYS : clientData.gateways || []);
    
  const [gatewayHealth, setGatewayHealth] = useState<Record<string, any>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  
  // Configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);

  // Real-time gateway health monitoring
  useEffect(() => {
    const subscription = subscribeToGatewayHealth((healthData) => {
      setGatewayHealth(prev => ({
        ...prev,
        [healthData.gateway_id]: {
          is_online: healthData.is_online,
          latency_ms: healthData.latency_ms,
          last_checked: healthData.created_at,
          success_rate: healthData.success_rate || 100
        }
      }));
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Demo real-time health data for Ramlal client
  useEffect(() => {
    if (clientId === 'demo-ramlal-client-2024') {
      // Simulate real-time health updates for demo gateways
      const interval = setInterval(() => {
        const demoHealthData: Record<string, any> = {
          'gw-razorpay-demo': {
            is_online: true,
            latency_ms: 200 + Math.random() * 100,
            last_checked: new Date().toISOString(),
            success_rate: 98.5 + Math.random() * 1.5
          },
          'gw-payu-demo': {
            is_online: true,
            latency_ms: 280 + Math.random() * 80,
            last_checked: new Date().toISOString(),
            success_rate: 96.8 + Math.random() * 2
          },
          'gw-ccavenue-demo': {
            is_online: true,
            latency_ms: 380 + Math.random() * 60,
            last_checked: new Date().toISOString(),
            success_rate: 94.2 + Math.random() * 1.8
          },
          'gw-phonepe-demo': {
            is_online: true,
            latency_ms: 250 + Math.random() * 70,
            last_checked: new Date().toISOString(),
            success_rate: 97.1 + Math.random() * 1.9
          },
          'gw-paytm-demo': {
            is_online: false, // Disabled gateway
            latency_ms: 0,
            last_checked: new Date().toISOString(),
            success_rate: 0
          },
          'gw-instamojo-demo': {
            is_online: true,
            latency_ms: 420 + Math.random() * 50,
            last_checked: new Date().toISOString(),
            success_rate: 93.8 + Math.random() * 2.2
          },
          'gw-billdesk-demo': {
            is_online: true,
            latency_ms: 5800 + Math.random() * 800, // Slow gateway
            last_checked: new Date().toISOString(),
            success_rate: 92.4 + Math.random() * 1.6
          },
          'gw-cashfree-demo': {
            is_online: true,
            latency_ms: 270 + Math.random() * 60,
            last_checked: new Date().toISOString(),
            success_rate: 96.3 + Math.random() * 1.7
          }
        };
        
        setGatewayHealth(demoHealthData);
      }, 3000); // Update every 3 seconds

      // Initial health data
      setGatewayHealth({
        'gw-razorpay-demo': { is_online: true, latency_ms: 245, success_rate: 98.5 },
        'gw-payu-demo': { is_online: true, latency_ms: 320, success_rate: 96.8 },
        'gw-ccavenue-demo': { is_online: true, latency_ms: 410, success_rate: 94.2 },
        'gw-phonepe-demo': { is_online: true, latency_ms: 280, success_rate: 97.1 },
        'gw-paytm-demo': { is_online: false, latency_ms: 0, success_rate: 0 },
        'gw-instamojo-demo': { is_online: true, latency_ms: 445, success_rate: 93.8 },
        'gw-billdesk-demo': { is_online: true, latency_ms: 6200, success_rate: 92.4 },
        'gw-cashfree-demo': { is_online: true, latency_ms: 298, success_rate: 96.3 }
      });

      return () => clearInterval(interval);
    }
  }, [clientId]);

  // Toggle gateway on/off for specific client
  const toggleGateway = async (gatewayId: string, enabled: boolean) => {
    try {
      setLoading(true);
      
      // Use the hook's update function for optimistic updates
      await updateAssignment(gatewayId, { is_active: enabled });

      // Show success toast
      toast.success(
        `Gateway ${enabled ? 'सक्रिय' : 'निष्क्रिय'} कर दिया गया`,
        {
          description: `${effectiveGateways.find(g => g.id === gatewayId)?.name} अब ${enabled ? 'चालू' : 'बंद'} है`
        }
      );

      onGatewayUpdate?.();
    } catch (error: any) {
      console.error('Gateway toggle error:', error);
      
      toast.error('Gateway toggle करने में समस्या हुई', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test gateway connectivity
  const testGateway = async (gatewayId: string) => {
    try {
      setLoading(true);
      const result = await apiService.testGateway(gatewayId);
      
      if (result.success) {
        toast.success('Gateway test successful', {
          description: `Response time: ${result.response_time}ms`
        });
      } else {
        toast.error('Gateway test failed', {
          description: result.error || 'Connection test failed'
        });
      }
    } catch (error) {
      toast.error('Gateway test failed');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (gatewayId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [gatewayId]: !prev[gatewayId]
    }));
  };

  // Get gateway status badge
  const getStatusBadge = (gateway: Gateway) => {
    const health = gatewayHealth[gateway.id];
    const isOnline = health?.is_online !== false; // Default to true if no health data
    const isActive = gateway.is_active !== false;

    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Disabled</Badge>;
    }
    
    if (!isOnline) {
      return <Badge variant="destructive" className="bg-red-100 text-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Offline
      </Badge>;
    }

    const latency = health?.latency_ms || 0;
    if (latency > 5000) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">
        <Clock className="w-3 h-3 mr-1" />
        Slow ({latency}ms)
      </Badge>;
    }

    return <Badge variant="default" className="bg-green-100 text-green-600">
      <CheckCircle className="w-3 h-3 mr-1" />
      Online ({latency}ms)
    </Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Client API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Client Gateway Management</span>
              <Badge variant="outline">{effectiveGateways.length} gateways assigned</Badge>
              {assignmentsLoading && <Badge variant="secondary">Loading...</Badge>}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Client API Key */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Client API Key</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={clientData.client_key || ''} 
                  readOnly 
                  className="font-mono text-sm bg-white" 
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(clientData.client_key || '', 'Client API Key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Client Salt */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span>Client Salt</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={clientData.client_salt || ''} 
                  readOnly 
                  className="font-mono text-sm bg-white" 
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(clientData.client_salt || '', 'Client Salt')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gateway List with Toggle Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assigned Payment Gateways</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {effectiveGateways.filter(g => g.is_active !== false).length} active
              </Badge>
              <Badge variant="secondary">
                {effectiveGateways.filter(g => g.is_active === false).length} disabled
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
                      {effectiveGateways.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No gateways assigned to this client</p>
                {assignmentsLoading && <p className="text-sm text-blue-600 mt-2">Loading assignments...</p>}
                {error && <p className="text-sm text-red-600 mt-2">Error: {error}</p>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Controls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {effectiveGateways.map((gateway) => {
                  const health = gatewayHealth[gateway.id] || {};
                  const usagePercent = gateway.limit > 0 ? (gateway.monthly_volume / gateway.limit) * 100 : 0;
                  
                  return (
                    <TableRow key={gateway.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{gateway.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {gateway.provider} • Priority #{gateway.priority}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(gateway)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">
                            {health.success_rate || gateway.success_rate || 100}%
                          </span>
                          {(health.success_rate || gateway.success_rate || 100) >= 95 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            ₹{(gateway.monthly_volume || 0).toLocaleString()} / ₹{gateway.limit.toLocaleString()}
                          </div>
                          <Progress value={usagePercent} className="h-2 w-20" />
                          <div className="text-xs text-muted-foreground">
                            {usagePercent.toFixed(1)}% used
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-sm">
                          {health.latency_ms || gateway.response_time || '--'}ms
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {/* Toggle Switch */}
                          <Switch
                            checked={gateway.is_active !== false}
                            onCheckedChange={(enabled) => toggleGateway(gateway.id, enabled)}
                            disabled={loading}
                          />
                          
                          {/* Test Connection */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testGateway(gateway.id)}
                            disabled={loading}
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                          
                          {/* Gateway Settings */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGateway(gateway);
                              setConfigModalOpen(true);
                            }}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gateway Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Gateways</p>
                <p className="text-2xl font-bold text-green-600">
                  {effectiveGateways.filter(g => g.is_active !== false).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{effectiveGateways.reduce((sum, g) => sum + (g.monthly_volume || 0), 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {effectiveGateways.length > 0 
                    ? (effectiveGateways.reduce((sum, g) => sum + (g.success_rate || 100), 0) / effectiveGateways.length).toFixed(1) 
                    : '100'
                  }%
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gateway Configuration Modal */}
      <GatewayConfigurationModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedGateway(null);
        }}
        gateway={selectedGateway}
        onSuccess={() => {
          // Refresh gateway data after successful update
          setConfigModalOpen(false);
          setSelectedGateway(null);
          refetchAssignments();
          onGatewayUpdate?.();
          toast.success('Gateway configuration updated successfully');
        }}
      />
    </div>
  );
}; 