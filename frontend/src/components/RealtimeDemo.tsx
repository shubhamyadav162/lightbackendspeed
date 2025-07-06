import React, { useState, useEffect } from 'react';
import { 
  useTransactionUpdates, 
  usePaymentUpdates, 
  useSystemStatusUpdates, 
  useAlertUpdates,
  useWebhookEventUpdates,
  useGatewayHealthUpdates,
  useAuditLogUpdates,
  useWorkerHealthUpdates 
} from '../hooks/useRealtimeSubscription';

interface RealtimeEvent {
  id: string;
  table: string;
  event: string;
  timestamp: Date;
  data: any;
}

export const RealtimeDemo: React.FC = () => {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Add new event to the list
  const addEvent = (table: string, event: string, data: any) => {
    const newEvent: RealtimeEvent = {
      id: Date.now().toString(),
      table,
      event,
      timestamp: new Date(),
      data
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep only last 50 events
  };

  // Subscribe to different tables
  const transactionSubscription = useTransactionUpdates((transaction) => {
    addEvent('transactions', 'UPDATE', transaction);
  });

  const paymentSubscription = usePaymentUpdates((payment) => {
    addEvent('payments', 'UPDATE', payment);
  });

  const systemStatusSubscription = useSystemStatusUpdates((status) => {
    addEvent('system_status', 'UPDATE', status);
  });

  const alertSubscription = useAlertUpdates((alert) => {
    addEvent('alerts', 'INSERT', alert);
  });

  const webhookSubscription = useWebhookEventUpdates((webhook) => {
    addEvent('webhook_events', 'INSERT', webhook);
  });

  const gatewayHealthSubscription = useGatewayHealthUpdates((health) => {
    addEvent('gateway_health_metrics', 'INSERT', health);
  });

  const auditSubscription = useAuditLogUpdates((audit) => {
    addEvent('audit_logs', 'INSERT', audit);
  });

  const workerHealthSubscription = useWorkerHealthUpdates((worker) => {
    addEvent('worker_health', 'UPDATE', worker);
  });

  // Clear events
  const clearEvents = () => {
    setEvents([]);
  };

  // Get connection status
  const connectionStatus = {
    transactions: transactionSubscription.isConnected,
    payments: paymentSubscription.isConnected,
    systemStatus: systemStatusSubscription.isConnected,
    alerts: alertSubscription.isConnected,
    webhooks: webhookSubscription.isConnected,
    gatewayHealth: gatewayHealthSubscription.isConnected,
    audits: auditSubscription.isConnected,
    workerHealth: workerHealthSubscription.isConnected
  };

  const connectedCount = Object.values(connectionStatus).filter(Boolean).length;
  const totalSubscriptions = Object.keys(connectionStatus).length;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Realtime Monitor ({connectedCount}/{totalSubscriptions})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="font-semibold text-gray-800">Realtime Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {connectedCount}/{totalSubscriptions} connected
            </span>
            <button
              onClick={clearEvents}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Clear
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(connectionStatus).map(([key, connected]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`${connected ? 'text-green-600' : 'text-red-600'}`}>
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No realtime events yet</p>
            <p className="text-sm">Make a transaction or trigger system events to see updates</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {event.table}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {event.event}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                {event.data && (
                  <div className="space-y-1">
                    {event.data.id && (
                      <div><strong>ID:</strong> {event.data.id}</div>
                    )}
                    {event.data.status && (
                      <div><strong>Status:</strong> {event.data.status}</div>
                    )}
                    {event.data.amount && (
                      <div><strong>Amount:</strong> ₹{event.data.amount}</div>
                    )}
                    {event.data.gateway_code && (
                      <div><strong>Gateway:</strong> {event.data.gateway_code}</div>
                    )}
                    {event.data.transaction_id && (
                      <div><strong>Transaction:</strong> {event.data.transaction_id}</div>
                    )}
                    {event.data.message && (
                      <div><strong>Message:</strong> {event.data.message}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RealtimeDemo; 