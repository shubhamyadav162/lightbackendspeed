import React from 'react';
import { useAuditLogs } from '../../hooks/useApi';
import { ScrollArea } from '@radix-ui/react-scroll-area';

export const AuditLogsViewer: React.FC = () => {
  const { data, isLoading } = useAuditLogs({ limit: 50 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading audit logs…
      </div>
    );
  }

  const logs = data?.data || [];

  return (
    <ScrollArea className="h-96 w-full rounded-lg border border-gray-200">
      <ul className="divide-y divide-gray-200 text-sm">
        {logs.map((log: any) => (
          <li key={log.id} className="p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{log.action}</span>
              <span className="text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500 line-clamp-1">
              {log.table_name} – row_id: {log.row_id}
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default AuditLogsViewer; 