import React from 'react';
import { useSystemStatusStream, SystemStatusRow } from '../../hooks/useSystemStatusStream';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

const getColor = (status: SystemStatusRow['status']) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-100';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100';
    case 'down':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getIcon = (status: SystemStatusRow['status']) => {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'degraded':
      return AlertTriangle;
    case 'down':
      return XCircle;
    default:
      return HelpCircle;
  }
};

export const SystemStatusPanel: React.FC = () => {
  const rows = useSystemStatusStream();

  if (!rows.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse w-6 h-6 rounded-full bg-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Waiting for status updates…</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rows.map((row) => {
        const Icon = getIcon(row.status);
        return (
          <div
            key={row.component}
            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {row.component}
              </h3>
              <Icon className="w-5 h-5 text-gray-500" />
            </div>
            <div
              className={`inline-block px-2 py-1 text-xs rounded-full ${getColor(
                row.status
              )}`}
            >
              {row.status.toUpperCase()}
            </div>
            {typeof row.response_time_ms === 'number' && (
              <div className="text-xs text-gray-500 mt-2">
                {row.response_time_ms} ms
              </div>
            )}
            {row.message && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {row.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SystemStatusPanel; 