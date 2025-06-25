import React from 'react';
import { Shield, Server, Database, Globe } from 'lucide-react';
import { useSystemStatus } from '../../hooks/useApi';
import { useSystemStatusStream } from '../../hooks/useSystemStatusStream';

export const SystemStatus = () => {
  const { data: systemStatus, isLoading, error } = useSystemStatus();
  const streamRows = useSystemStatusStream();

  // Merge API data with stream updates
  const mergedStatus = streamRows.length > 0 ? {
    ...systemStatus,
    components: streamRows.reduce((acc: any, row) => {
      acc[row.component] = {
        status: row.status === 'healthy' ? 'operational' : row.status === 'degraded' ? 'warning' : 'down',
        uptime: new Date(row.updated_at).toLocaleString(),
      };
      return acc;
    }, {} as any),
  } : systemStatus;

  // Default status items with real API data integration
  const getStatusItems = () => {
    if (!mergedStatus) {
      return [
        { label: 'Payment Processing', status: 'unknown', icon: Shield, uptime: '0%' },
        { label: 'API Services', status: 'unknown', icon: Server, uptime: '0%' },
        { label: 'Database', status: 'unknown', icon: Database, uptime: '0%' },
        { label: 'External Gateways', status: 'unknown', icon: Globe, uptime: '0%' },
      ];
    }

    // Map API response to status items
    return [
      { 
        label: 'Payment Processing', 
        status: mergedStatus.payment_processing?.status || 'operational', 
        icon: Shield, 
        uptime: mergedStatus.payment_processing?.uptime || '99.9%' 
      },
      { 
        label: 'API Services', 
        status: mergedStatus.api_services?.status || 'operational', 
        icon: Server, 
        uptime: mergedStatus.api_services?.uptime || '99.8%' 
      },
      { 
        label: 'Database', 
        status: mergedStatus.database?.status || 'operational', 
        icon: Database, 
        uptime: mergedStatus.database?.uptime || '99.5%' 
      },
      { 
        label: 'External Gateways', 
        status: mergedStatus.external_gateways?.status || 'operational', 
        icon: Globe, 
        uptime: mergedStatus.external_gateways?.uptime || '99.7%' 
      },
    ];
  };

  const statusItems = getStatusItems();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-700 bg-green-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      case 'down': return 'text-red-700 bg-red-100';
      case 'unknown': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      case 'unknown': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getOverallStatus = () => {
    if (isLoading) return { status: 'loading', color: 'text-gray-700', dot: 'bg-gray-500' };
    if (error) return { status: 'error', color: 'text-red-700', dot: 'bg-red-500' };
    
    const hasDown = statusItems.some(item => item.status === 'down');
    const hasWarning = statusItems.some(item => item.status === 'warning');
    
    if (hasDown) return { status: 'System Issues Detected', color: 'text-red-700', dot: 'bg-red-500' };
    if (hasWarning) return { status: 'Minor Issues', color: 'text-yellow-700', dot: 'bg-yellow-500' };
    return { status: 'All Systems Operational', color: 'text-green-700', dot: 'bg-green-500' };
  };

  const overallStatus = getOverallStatus();

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <Server className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to fetch system status</p>
          <p className="text-sm text-gray-500 mt-1">Please check your connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLoading ? 'animate-pulse bg-gray-500' : `${overallStatus.dot} animate-pulse`}`}></div>
          <span className={`text-sm font-medium ${overallStatus.color}`}>
            {isLoading ? 'Checking...' : overallStatus.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <div className={`w-3 h-3 rounded-full ${isLoading ? 'animate-pulse bg-gray-500' : getStatusDot(item.status)}`}></div>
              </div>
              <div className="text-sm font-medium text-gray-900">{item.label}</div>
              <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${getStatusColor(item.status)}`}>
                {isLoading ? 'Loading...' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Uptime: {isLoading ? '--' : item.uptime}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
