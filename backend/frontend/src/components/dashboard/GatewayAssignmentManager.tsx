import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Trash2, GripVertical, Save, RotateCcw } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  monthly_limit: number;
  success_rate: number;
}

interface AssignedGateway extends Gateway {
  rotation_order: number;
  weight: number;
  daily_limit: number;
  assigned: boolean;
}

interface Client {
  id: string;
  company_name: string;
  rotation_mode: string;
  total_assigned_gateways: number;
}

interface GatewayAssignmentManagerProps {
  clientId?: string;
  onAssignmentComplete?: () => void;
}

export function GatewayAssignmentManager({ clientId, onAssignmentComplete }: GatewayAssignmentManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '');
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>([]);
  const [assignedGateways, setAssignedGateways] = useState<AssignedGateway[]>([]);
  const [rotationMode, setRotationMode] = useState<string>('round_robin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientAssignments();
    }
  }, [selectedClientId]);

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsResponse = await fetch('/api/v1/admin/rotation', {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const clientsData = await clientsResponse.json();
      setClients(clientsData.clients || []);

      // Fetch available gateways
      const gatewaysResponse = await fetch('/api/v1/admin/gateways', {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const gatewaysData = await gatewaysResponse.json();
      setAvailableGateways(gatewaysData.gateways || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      });
    }
  };

  const fetchClientAssignments = async () => {
    if (!selectedClientId) return;

    try {
      const response = await fetch(`/api/v1/admin/rotation?client_id=${selectedClientId}`, {
        headers: { 'x-api-key': 'admin_test_key' }
      });
      const data = await response.json();

      if (data.client) {
        setRotationMode(data.client.rotation_mode || 'round_robin');
        
        const assignments = data.client.client_gateway_assignments || [];
        const assigned: AssignedGateway[] = assignments.map((assignment: any) => ({
          ...assignment.payment_gateways,
          rotation_order: assignment.rotation_order,
          weight: assignment.weight,
          daily_limit: assignment.daily_limit,
          assigned: true
        }));

        setAssignedGateways(assigned);
      }
    } catch (error) {
      console.error('Error fetching client assignments:', error);
    }
  };

  const handleGatewayToggle = (gateway: Gateway, checked: boolean) => {
    if (checked) {
      // Add gateway to assignments
      const newAssignment: AssignedGateway = {
        ...gateway,
        rotation_order: assignedGateways.length + 1,
        weight: 1.0,
        daily_limit: 1000000,
        assigned: true
      };
      setAssignedGateways([...assignedGateways, newAssignment]);
    } else {
      // Remove gateway from assignments
      const filtered = assignedGateways.filter(g => g.id !== gateway.id);
      // Reorder rotation positions
      const reordered = filtered.map((g, index) => ({
        ...g,
        rotation_order: index + 1
      }));
      setAssignedGateways(reordered);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(assignedGateways);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update rotation orders
    const reordered = items.map((item, index) => ({
      ...item,
      rotation_order: index + 1
    }));

    setAssignedGateways(reordered);
  };

  const updateGatewayProperty = (gatewayId: string, property: string, value: any) => {
    setAssignedGateways(prev => 
      prev.map(g => 
        g.id === gatewayId ? { ...g, [property]: value } : g
      )
    );
  };

  const saveAssignments = async () => {
    if (!selectedClientId) {
      toast({
        title: 'Error',
        description: 'Please select a client',
        variant: 'destructive'
      });
      return;
    }

    if (assignedGateways.length === 0) {
      toast({
        title: 'Error', 
        description: 'Please assign at least one gateway',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const gatewayIds = assignedGateways.map(g => g.id);

      const response = await fetch('/api/v1/admin/rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          gateway_ids: gatewayIds,
          rotation_mode: rotationMode
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Assigned ${gatewayIds.length} gateways in rotation order`,
          variant: 'default'
        });

        // Update individual gateway properties if needed
        for (const gateway of assignedGateways) {
          if (gateway.weight !== 1.0 || gateway.daily_limit !== 1000000) {
            await fetch('/api/v1/admin/rotation/controls', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'admin_test_key'
              },
              body: JSON.stringify({
                action: 'update_gateway_weight',
                client_id: selectedClientId,
                params: {
                  gateway_id: gateway.id,
                  weight: gateway.weight
                }
              })
            });
          }
        }

        onAssignmentComplete?.();
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
      setSaving(false);
    }
  };

  const isGatewayAssigned = (gatewayId: string) => {
    return assignedGateways.some(g => g.id === gatewayId);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignment data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gateway Assignment Manager</h2>
          <p className="text-muted-foreground">Configure round-robin rotation for clients</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client-select">Client</Label>
              <Select 
                value={selectedClientId} 
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name} ({client.total_assigned_gateways} gateways)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rotation-mode">Rotation Mode</Label>
              <Select 
                value={rotationMode} 
                onValueChange={setRotationMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="priority">Priority Based</SelectItem>
                  <SelectItem value="smart">Smart Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClientId && (
        <>
          {/* Available Gateways */}
          <Card>
            <CardHeader>
              <CardTitle>Available Gateways</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select gateways to include in the rotation
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableGateways.map(gateway => (
                  <div
                    key={gateway.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={isGatewayAssigned(gateway.id)}
                      onCheckedChange={(checked) => handleGatewayToggle(gateway, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{gateway.name}</div>
                      <div className="text-sm text-muted-foreground">{gateway.provider}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={gateway.is_active ? 'default' : 'secondary'}>
                          {gateway.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs">{gateway.success_rate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Gateways - Drag & Drop Rotation Order */}
          {assignedGateways.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GripVertical className="w-4 h-4 mr-2" />
                  Rotation Order (Drag to Reorder)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Payments will rotate: 1 → 2 → 3 → ... → {assignedGateways.length} → 1 → 2 → ...
                </p>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="gateways">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {assignedGateways.map((gateway, index) => (
                          <Draggable
                            key={gateway.id}
                            draggableId={gateway.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center space-x-4 p-4 border rounded-lg ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                
                                <Badge variant="outline" className="font-mono min-w-[2rem]">
                                  {gateway.rotation_order}
                                </Badge>
                                
                                <div className="flex-1">
                                  <div className="font-semibold">{gateway.name}</div>
                                  <div className="text-sm text-muted-foreground">{gateway.provider}</div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <div className="text-sm">
                                    <Label htmlFor={`weight-${gateway.id}`}>Weight:</Label>
                                    <Input
                                      id={`weight-${gateway.id}`}
                                      type="number"
                                      min="0.1"
                                      max="5.0"
                                      step="0.1"
                                      value={gateway.weight}
                                      onChange={(e) => updateGatewayProperty(gateway.id, 'weight', parseFloat(e.target.value))}
                                      className="w-20 ml-1"
                                    />
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGatewayToggle(gateway, false)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveAssignments}
              disabled={saving || assignedGateways.length === 0}
              size="lg"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Assignment ({assignedGateways.length} gateways)
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 