
import React from 'react';
import { Shield, Database, Settings, Bell } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    {
      label: 'Emergency Stop',
      description: 'Halt all payment processing',
      icon: Shield,
      color: 'red',
      critical: true
    },
    {
      label: 'Force Backup',
      description: 'Create immediate system backup',
      icon: Database,
      color: 'blue'
    },
    {
      label: 'System Maintenance',
      description: 'Enable maintenance mode',
      icon: Settings,
      color: 'yellow'
    },
    {
      label: 'Alert Broadcast',
      description: 'Send notification to all admins',
      icon: Bell,
      color: 'green'
    },
  ];

  const getButtonClass = (color: string, critical = false) => {
    if (critical) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    }
    
    const colorMap = {
      red: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              className={`w-full p-4 border rounded-lg text-left transition-colors ${getButtonClass(action.color, action.critical)}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm opacity-75">{action.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* System Controls */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">System Controls</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Auto-scaling</span>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="relative w-8 h-4 bg-green-500 rounded-full">
                <div className="absolute w-3 h-3 bg-white rounded-full top-0.5 translate-x-4 transition-transform"></div>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Load balancing</span>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="relative w-8 h-4 bg-green-500 rounded-full">
                <div className="absolute w-3 h-3 bg-white rounded-full top-0.5 translate-x-4 transition-transform"></div>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Debug mode</span>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" />
              <div className="relative w-8 h-4 bg-gray-300 rounded-full">
                <div className="absolute w-3 h-3 bg-white rounded-full top-0.5 translate-x-0.5 transition-transform"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
