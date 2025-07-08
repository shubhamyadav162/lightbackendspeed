import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// TODO: Replace with real data from useWhatsAppUsage hook
const demoUsageData = [
  { template: 'LOW_BALANCE', count: 5 },
  { template: 'TXN_UPDATE', count: 150 },
  { template: 'WELCOME_MSG', count: 20 },
];

export function WhatsAppUsage() {
  // const { data: usageData, isLoading, error } = useWhatsAppUsage(); // Future implementation

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Notification Usage</CardTitle>
        <CardDescription>
          Your usage of WhatsApp notifications over the last 30 days, grouped by template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={demoUsageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="template" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Messages Sent" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 