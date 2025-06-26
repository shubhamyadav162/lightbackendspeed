import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Settings, TestTube, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkUpdateGatewayPriority } from '@/hooks/useApi';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  priority: number;
  successRate: number;
  dailyLimit: number;
  currentUsage: number;
  responseTime: number;
  fees: number;
  region: string;
}

interface DraggableGatewayListProps {
  gateways: Gateway[];
  onToggleStatus: (id: string) => void;
  onTestConnection: (id: string) => void;
  onConfigure: (gateway: Gateway) => void;
  onPriorityChange?: (updatedGateways: Gateway[]) => void;
}

interface SortableGatewayItemProps {
  gateway: Gateway;
  onToggleStatus: (id: string) => void;
  onTestConnection: (id: string) => void;
  onConfigure: (gateway: Gateway) => void;
}

const SortableGatewayItem: React.FC<SortableGatewayItemProps> = ({
  gateway,
  onToggleStatus,
  onTestConnection,
  onConfigure,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gateway.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 99) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {gateway.name}
                  <Badge className={getStatusColor(gateway.status)}>
                    {gateway.status}
                  </Badge>
                  <Badge variant="outline">Priority: {gateway.priority}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {gateway.provider} • {gateway.region}
                </p>
              </div>
            </div>
            <Switch
              checked={gateway.status === 'active'}
              onCheckedChange={() => onToggleStatus(gateway.id)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <span className={`text-sm font-bold ${getHealthColor(gateway.successRate)}`}>
                {gateway.successRate}%
              </span>
            </div>
            <Progress value={gateway.successRate} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Response Time</p>
                <p className="font-medium">{gateway.responseTime}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fees</p>
                <p className="font-medium">{gateway.fees}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Daily Limit</p>
                <p className="font-medium">₹{gateway.dailyLimit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Usage</p>
                <p className="font-medium">₹{gateway.currentUsage.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTestConnection(gateway.id)}
                className="flex-1"
              >
                <TestTube className="w-4 h-4 mr-1" />
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigure(gateway)}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DraggableGatewayList: React.FC<DraggableGatewayListProps> = ({
  gateways,
  onToggleStatus,
  onTestConnection,
  onConfigure,
  onPriorityChange,
}) => {
  const [items, setItems] = useState(gateways);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Use optimistic bulk update hook
  const bulkUpdatePriority = useBulkUpdateGatewayPriority();

  React.useEffect(() => {
    setItems(gateways);
    setHasChanges(false);
  }, [gateways]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update priorities based on new order
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          priority: index + 1
        }));
        
        setHasChanges(true);
        return updatedItems;
      });
    }
  };

  const handleSavePriorityOrder = async () => {
    try {
      const priorities = items.map((item, index) => ({
        id: item.id,
        priority: index + 1
      }));
      
      await bulkUpdatePriority.mutateAsync({ priorities });
      setHasChanges(false);
      
      if (onPriorityChange) {
        onPriorityChange(items);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((gateway) => (
            <SortableGatewayItem
              key={gateway.id}
              gateway={gateway}
              onToggleStatus={onToggleStatus}
              onTestConnection={onTestConnection}
              onConfigure={onConfigure}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {hasChanges && (
        <div className="sticky bottom-4 bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium">
                Priority order में changes हैं
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setItems(gateways);
                  setHasChanges(false);
                }}
                disabled={bulkUpdatePriority.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePriorityOrder}
                disabled={bulkUpdatePriority.isPending}
              >
                {bulkUpdatePriority.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Priority Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
