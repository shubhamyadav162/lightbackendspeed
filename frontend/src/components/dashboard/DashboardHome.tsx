
import React from 'react';
import { SystemStatus } from './SystemStatus';
import { TransactionMetrics } from './TransactionMetrics';
import { GatewayHealth } from './GatewayHealth';
import { RevenueChart } from './RevenueChart';
import { AlertCenter } from './AlertCenter';
import { QuickActions } from './QuickActions';

export const DashboardHome = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600">Monitor and control your payment gateway ecosystem</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-900">2 seconds ago</div>
        </div>
      </div>

      {/* System Status */}
      <SystemStatus />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionMetrics />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Gateway Health & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GatewayHealth />
        <RevenueChart />
      </div>

      {/* Alert Center */}
      <AlertCenter />
    </div>
  );
};
