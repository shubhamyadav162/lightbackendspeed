import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { AlertCircle, RotateCcw, Play, Pause, Settings, BarChart3, ChevronRight } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  rotation_order: number;
  is_active: boolean;
  weight: number;
  daily_usage: number;
  daily_limit: number;
  last_used_at: string;
  transaction_percentage: string;
  amount_percentage: string;
}

interface RotationStatus {
  mode: string;
  current_position: number;
  total_gateways: number;
  last_rotation: string;
  daily_reset: boolean;
}

interface RotationManagerProps {
  clientId: string;
  clientName: string;
}

export function RotationManager({ clientId, clientName }: RotationManagerProps) {
  const [rotationStatus, setRotationStatus] = useState<RotationStatus | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRotationData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchRotationData, 10000);
    return () => clearInterval(interval);
  }, [clientId]);

  const fetchRotationData = async () => {
    try {
      // Fetch rotation configuration
      const rotationResponse = await fetch(`/api/v1/admin/rotation?client_id=${clientId}`, {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const rotationData = await rotationResponse.json();

      if (rotationData.client) {
        setRotationStatus(rotationData.rotation_status);
        setGateways(rotationData.client.client_gateway_assignments || []);
      }

      // Fetch analytics
      const analyticsResponse = await fetch(`/api/v1/admin/rotation/analytics?client_id=${clientId}&days=7`, {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching rotation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rotation data',
        variant: 'destructive'
      });
    }
  };

  const executeRotationAction = async (action: string, params?: any) => {
    setActionLoading(action);
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
        await fetchRotationData(); // Refresh data
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
      case 'round_robin': return 'bg-green-500';
      case 'priority': return 'bg-blue-500';
      case 'smart': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getCurrentGateway = () => {
    return gateways.find(g => g.rotation_order === rotationStatus?.current_position);
  };

  const getNextGateway = () => {
    const nextPosition = rotationStatus ? 
      (rotationStatus.current_position % rotationStatus.total_gateways) + 1 : 1;
    return gateways.find(g => g.rotation_order === nextPosition);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading rotation data...</div>;
  }

  const currentGateway = getCurrentGateway();
  const nextGateway = getNextGateway();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rotation Manager</h2>
          <p className="text-muted-foreground">Client: {clientName}</p>
        </div>
        <Button onClick={fetchRotationData} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getRotationModeColor(rotationStatus?.mode || '')}>
                {rotationStatus?.mode?.toUpperCase()}
              </Badge>
              <Select 
                value={rotationStatus?.mode} 
                onValueChange={(mode) => executeRotationAction('change_mode', { mode })}
              >
                <SelectTrigger className="w-auto border-0 p-0 h-auto">
                  <Settings className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="priority">Priority Based</SelectItem>
                  <SelectItem value="smart">Smart Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                {rotationStatus?.current_position} / {rotationStatus?.total_gateways}
              </span>
              <Progress 
                value={(rotationStatus?.current_position || 0) / (rotationStatus?.total_gateways || 1) * 100} 
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Daily Reset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={rotationStatus?.daily_reset}
                onCheckedChange={(enabled) => executeRotationAction('toggle_daily_reset', { enabled })}
              />
              <span>{rotationStatus?.daily_reset ? 'Enabled' : 'Disabled'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current & Next Gateway */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="w-4 h-4 mr-2 text-green-500" />
              Current Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentGateway ? (
              <div className="space-y-2">
                <div className="font-semibold">{currentGateway.name}</div>
                <div className="text-sm text-muted-foreground">{currentGateway.provider}</div>
                <Badge variant={currentGateway.is_active ? 'default' : 'secondary'}>
                  Position {currentGateway.rotation_order}
                </Badge>
                <div className="text-xs">
                  Usage: {((currentGateway.daily_usage / currentGateway.daily_limit) * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No current gateway</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChevronRight className="w-4 h-4 mr-2 text-blue-500" />
              Next Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextGateway ? (
              <div className="space-y-2">
                <div className="font-semibold">{nextGateway.name}</div>
                <div className="text-sm text-muted-foreground">{nextGateway.provider}</div>
                <Badge variant={nextGateway.is_active ? 'default' : 'secondary'}>
                  Position {nextGateway.rotation_order}
                </Badge>
                <div className="text-xs">
                  Usage: {((nextGateway.daily_usage / nextGateway.daily_limit) * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No next gateway</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => executeRotationAction('reset_position')}
              variant="outline"
              disabled={actionLoading === 'reset_position'}
            >
              {actionLoading === 'reset_position' ? 'Resetting...' : 'Reset Position'}
            </Button>
            <Button
              onClick={() => executeRotationAction('manual_advance', { steps: 1 })}
              variant="outline"
              disabled={actionLoading === 'manual_advance'}
            >
              {actionLoading === 'manual_advance' ? 'Advancing...' : 'Advance +1'}
            </Button>
            <Button
              onClick={() => executeRotationAction('manual_advance', { steps: 5 })}
              variant="outline"
              disabled={actionLoading === 'manual_advance'}
            >
              Advance +5
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Distribution Analytics (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
                <div className="text-2xl font-bold">{analytics.summary?.total_transactions || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold">₹{analytics.summary?.total_amount_rupees || '0'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Gateways</div>
                <div className="text-2xl font-bold">{analytics.summary?.active_gateways || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Distribution Quality</div>
                <Badge variant={
                  analytics.summary?.distribution_quality === 'Excellent' ? 'default' :
                  analytics.summary?.distribution_quality === 'Good' ? 'secondary' : 'destructive'
                }>
                  {analytics.summary?.distribution_quality || 'Unknown'}
                </Badge>
              </div>
            </div>

            {analytics.summary?.distribution_quality !== 'Excellent' && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">
                  Uneven distribution detected. Consider resetting rotation or checking gateway availability.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gateway List with Rotation Order */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Rotation Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gateways
              .sort((a, b) => a.rotation_order - b.rotation_order)
              .map((gateway) => (
                <div
                  key={gateway.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    gateway.rotation_order === rotationStatus?.current_position
                      ? 'border-green-500 bg-green-50'
                      : gateway.rotation_order === ((rotationStatus?.current_position || 0) % (rotationStatus?.total_gateways || 1)) + 1
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="font-mono">
                      {gateway.rotation_order}
                    </Badge>
                    <div>
                      <div className="font-semibold">{gateway.name}</div>
                      <div className="text-sm text-muted-foreground">{gateway.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm">
                      <div>Usage: {gateway.transaction_percentage}%</div>
                      <div className="text-muted-foreground">
                        {((gateway.daily_usage / gateway.daily_limit) * 100).toFixed(1)}% today
                      </div>
                    </div>
                    <Badge variant={gateway.is_active ? 'default' : 'secondary'}>
                      {gateway.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 