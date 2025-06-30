import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { 
  RotateCcw, 
  Settings, 
  Play, 
  Pause, 
  ChevronRight, 
  Search,
  BarChart3,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface ClientRotationInfo {
  id: string;
  company_name: string;
  rotation_mode: string;
  current_rotation_position: number;
  total_assigned_gateways: number;
  last_rotation_at: string;
  status: string;
  current_gateway?: {
    name: string;
    provider: string;
  };
  next_gateway?: {
    name: string;
    provider: string;
  };
}

interface OverviewStats {
  total_clients: number;
  active_rotations: number;
  total_gateways_assigned: number;
  clients_needing_attention: number;
}

interface ClientRotationOverviewProps {
  onSelectClient?: (clientId: string) => void;
  onManageRotation?: (clientId: string) => void;
}

export function ClientRotationOverview({ onSelectClient, onManageRotation }: ClientRotationOverviewProps) {
  const [clients, setClients] = useState<ClientRotationInfo[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientRotationInfo[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    total_clients: 0,
    active_rotations: 0,
    total_gateways_assigned: 0,
    clients_needing_attention: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverviewData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchOverviewData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    const filtered = clients.filter(client =>
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rotation_mode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchOverviewData = async () => {
    try {
      const response = await fetch('/api/v1/admin/rotation', {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const data = await response.json();

      if (data.clients) {
        // Enhance client data with current/next gateway info
        const enhancedClients = await Promise.all(
          data.clients.map(async (client: any) => {
            // Fetch detailed rotation info for each client
            try {
              const detailResponse = await fetch(`/api/v1/admin/rotation?client_id=${client.id}`, {
                headers: { 'x-api-key': 'admin_test_key' }
              });
              const detailData = await detailResponse.json();

              const assignments = detailData.client?.client_gateway_assignments || [];
              const currentGateway = assignments.find((a: any) => a.rotation_order === client.current_rotation_position);
              const nextPosition = client.total_assigned_gateways > 0 ? 
                (client.current_rotation_position % client.total_assigned_gateways) + 1 : 1;
              const nextGateway = assignments.find((a: any) => a.rotation_order === nextPosition);

              return {
                ...client,
                current_gateway: currentGateway ? {
                  name: currentGateway.payment_gateways.name,
                  provider: currentGateway.payment_gateways.provider
                } : undefined,
                next_gateway: nextGateway ? {
                  name: nextGateway.payment_gateways.name,
                  provider: nextGateway.payment_gateways.provider
                } : undefined
              };
            } catch {
              return client;
            }
          })
        );

        setClients(enhancedClients);

        // Calculate overview stats
        const stats: OverviewStats = {
          total_clients: enhancedClients.length,
          active_rotations: enhancedClients.filter(c => c.total_assigned_gateways > 0).length,
          total_gateways_assigned: enhancedClients.reduce((sum, c) => sum + c.total_assigned_gateways, 0),
          clients_needing_attention: enhancedClients.filter(c => 
            c.total_assigned_gateways === 0 || c.status !== 'active'
          ).length
        };
        setOverviewStats(stats);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rotation overview',
        variant: 'destructive'
      });
    }
  };

  const executeQuickAction = async (clientId: string, action: string, params?: any) => {
    setActionLoading(`${clientId}-${action}`);
    try {
      const response = await fetch('/api/v1/admin/rotation/controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        },
        body: JSON.stringify({
          action,
          client_id: clientId,
          params
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'default'
        });
        await fetchOverviewData(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRotationModeColor = (mode: string) => {
    switch (mode) {
      case 'round_robin': return 'bg-green-500 text-white';
      case 'priority': return 'bg-blue-500 text-white';
      case 'smart': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (client: ClientRotationInfo) => {
    if (client.status !== 'active') return 'destructive';
    if (client.total_assigned_gateways === 0) return 'secondary';
    return 'default';
  };

  const needsAttention = (client: ClientRotationInfo) => {
    return client.total_assigned_gateways === 0 || client.status !== 'active';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading rotation overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Rotation Overview</h2>
          <p className="text-muted-foreground">Monitor and control payment gateway rotations</p>
        </div>
        <Button onClick={fetchOverviewData} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{overviewStats.total_clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Rotations</p>
                <p className="text-2xl font-bold">{overviewStats.active_rotations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Gateways</p>
                <p className="text-2xl font-bold">{overviewStats.total_gateways_assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-bold">{overviewStats.clients_needing_attention}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients by name or rotation mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <Card 
            key={client.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              needsAttention(client) ? 'border-orange-200 bg-orange-50' : ''
            }`}
            onClick={() => onSelectClient?.(client.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.company_name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {needsAttention(client) && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  <Badge className={getRotationModeColor(client.rotation_mode)}>
                    {client.rotation_mode.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Rotation Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rotation Position</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">
                    {client.current_rotation_position} / {client.total_assigned_gateways}
                  </span>
                  <Progress 
                    value={client.total_assigned_gateways > 0 ? 
                      (client.current_rotation_position / client.total_assigned_gateways) * 100 : 0
                    } 
                    className="w-20 h-2"
                  />
                </div>
              </div>

              {/* Current and Next Gateway */}
              {client.current_gateway && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Current</div>
                    <div className="font-semibold">{client.current_gateway.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {client.current_gateway.provider}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Next</div>
                    <div className="font-semibold">
                      {client.next_gateway?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.next_gateway?.provider || ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={getStatusColor(client)}>
                  {client.status.toUpperCase()}
                </Badge>
                
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeQuickAction(client.id, 'reset_position');
                    }}
                    disabled={actionLoading === `${client.id}-reset_position`}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeQuickAction(client.id, 'manual_advance', { steps: 1 });
                    }}
                    disabled={actionLoading === `${client.id}-manual_advance`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageRotation?.(client.id);
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Warning for clients needing attention */}
              {needsAttention(client) && (
                <div className="flex items-center space-x-2 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {client.total_assigned_gateways === 0 
                      ? 'No gateways assigned - configure rotation'
                      : 'Client inactive - check status'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found matching your search.</p>
        </div>
      )}
    </div>
  );
} 