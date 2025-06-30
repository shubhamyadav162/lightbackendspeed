
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RevenueChart = () => {
  const data = [
    { day: 'Mon', revenue: 12400 },
    { day: 'Tue', revenue: 15600 },
    { day: 'Wed', revenue: 18200 },
    { day: 'Thu', revenue: 16800 },
    { day: 'Fri', revenue: 22100 },
    { day: 'Sat', revenue: 19700 },
    { day: 'Sun', revenue: 14300 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">$119,100</div>
          <div className="text-sm text-gray-500">This week</div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
