
import React from 'react';

export const GatewayHealth = () => {
  const gateways = [
    { name: 'Stripe', status: 'operational', load: 85, priority: 1 },
    { name: 'PayPal', status: 'operational', load: 72, priority: 2 },
    { name: 'Square', status: 'warning', load: 95, priority: 3 },
    { name: 'Razorpay', status: 'operational', load: 45, priority: 4 },
    { name: 'Paytm', status: 'down', load: 0, priority: 5 },
    { name: 'PhonePe', status: 'operational', load: 68, priority: 6 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLoadColor = (load: number) => {
    if (load >= 90) return 'bg-red-500';
    if (load >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Gateway Health Matrix</h2>
      
      <div className="space-y-3">
        {gateways.map((gateway, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(gateway.status)}`}></div>
              <div>
                <div className="font-medium text-gray-900">{gateway.name}</div>
                <div className="text-xs text-gray-500">Priority #{gateway.priority}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{gateway.load}%</div>
                <div className="text-xs text-gray-500">Load</div>
              </div>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getLoadColor(gateway.load)}`}
                  style={{ width: `${gateway.load}%` }}
                ></div>
              </div>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={gateway.status !== 'down'} 
                  className="sr-only"
                  readOnly
                />
                <div className={`relative w-8 h-4 rounded-full transition-colors ${
                  gateway.status !== 'down' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-transform ${
                    gateway.status !== 'down' ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
