import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeSubscription(options: RealtimeSubscriptionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const { table, event = '*', filter, onInsert, onUpdate, onDelete, onChange } = options;
    
    // Create channel name
    const channelName = `realtime-${table}`;
    
    // Create channel
    const channel = supabase.channel(channelName);
    
    // Configure postgres changes
    let changeConfig: any = {
      event,
      schema: 'public',
      table,
    };
    
    if (filter) {
      changeConfig.filter = filter;
    }
    
    // Add postgres changes listener
    channel.on('postgres_changes', changeConfig, (payload) => {
      console.log(`[Realtime] ${table} - ${payload.eventType}:`, payload);
      
      // Call specific handlers
      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(payload);
      } else if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(payload);
      } else if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(payload);
      }
      
      // Call generic handler
      if (onChange) {
        onChange(payload);
      }
    });
    
    // Subscribe to channel
    channel.subscribe((status) => {
      console.log(`[Realtime] ${table} subscription status:`, status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'CHANNEL_ERROR') {
        setError(`Failed to subscribe to ${table} realtime updates`);
      } else if (status === 'TIMED_OUT') {
        setError(`Timeout while subscribing to ${table} realtime updates`);
      } else {
        setError(null);
      }
    });
    
    channelRef.current = channel;
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [options.table, options.event, options.filter]);

  return { isConnected, error };
}

// Specific hooks for different tables
export function useTransactionUpdates(onTransactionUpdate?: (transaction: any) => void) {
  return useRealtimeSubscription({
    table: 'transactions',
    event: '*',
    onChange: (payload) => {
      if (onTransactionUpdate) {
        onTransactionUpdate(payload.new || payload.old);
      }
    }
  });
}

export function usePaymentUpdates(onPaymentUpdate?: (payment: any) => void) {
  return useRealtimeSubscription({
    table: 'payments',
    event: '*',
    onChange: (payload) => {
      if (onPaymentUpdate) {
        onPaymentUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useSystemStatusUpdates(onStatusUpdate?: (status: any) => void) {
  return useRealtimeSubscription({
    table: 'system_status',
    event: '*',
    onChange: (payload) => {
      if (onStatusUpdate) {
        onStatusUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useAlertUpdates(onAlertUpdate?: (alert: any) => void) {
  return useRealtimeSubscription({
    table: 'alerts',
    event: '*',
    onChange: (payload) => {
      if (onAlertUpdate) {
        onAlertUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useWebhookEventUpdates(onWebhookUpdate?: (webhook: any) => void) {
  return useRealtimeSubscription({
    table: 'webhook_events',
    event: '*',
    onChange: (payload) => {
      if (onWebhookUpdate) {
        onWebhookUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useGatewayHealthUpdates(onHealthUpdate?: (health: any) => void) {
  return useRealtimeSubscription({
    table: 'gateway_health_metrics',
    event: '*',
    onChange: (payload) => {
      if (onHealthUpdate) {
        onHealthUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useAuditLogUpdates(onAuditUpdate?: (audit: any) => void) {
  return useRealtimeSubscription({
    table: 'audit_logs',
    event: '*',
    onChange: (payload) => {
      if (onAuditUpdate) {
        onAuditUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useWorkerHealthUpdates(onWorkerUpdate?: (worker: any) => void) {
  return useRealtimeSubscription({
    table: 'worker_health',
    event: '*',
    onChange: (payload) => {
      if (onWorkerUpdate) {
        onWorkerUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useQueueMetricsUpdates(onQueueUpdate?: (queue: any) => void) {
  return useRealtimeSubscription({
    table: 'queue_metrics',
    event: '*',
    onChange: (payload) => {
      if (onQueueUpdate) {
        onQueueUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useCommissionUpdates(onCommissionUpdate?: (commission: any) => void) {
  return useRealtimeSubscription({
    table: 'commission_entries',
    event: '*',
    onChange: (payload) => {
      if (onCommissionUpdate) {
        onCommissionUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useWhatsAppNotificationUpdates(onNotificationUpdate?: (notification: any) => void) {
  return useRealtimeSubscription({
    table: 'whatsapp_notifications',
    event: '*',
    onChange: (payload) => {
      if (onNotificationUpdate) {
        onNotificationUpdate(payload.new || payload.old);
      }
    }
  });
}

export function useClientTransactionUpdates(clientId?: string, onTransactionUpdate?: (transaction: any) => void) {
  return useRealtimeSubscription({
    table: 'client_transactions',
    event: '*',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onChange: (payload) => {
      if (onTransactionUpdate) {
        onTransactionUpdate(payload.new || payload.old);
      }
    }
  });
} 