"use client";

import React from 'react';
import { useQueueMetrics } from '../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// This is sample data for the chart. In a real application, you would
// need to store and fetch historical queue metrics to populate this.
const sampleHistoricalData = [
  { name: '10:00', waiting: 4, active: 24, failed: 4 },
  { name: '10:05', waiting: 3, active: 13, failed: 9 },
  { name: '10:10', waiting: 2, active: 98, failed: 2 },
  { name: '10:15', waiting: 2, active: 39, failed: 0 },
  { name: '10:20', waiting: 3, active: 48, failed: 1 },
  { name: '10:25', waiting: 4, active: 13, failed: 0 },
  { name: '10:30', waiting: 1, active: 43, failed: 2 },
];

export default function QueueMonitor() {
  const { data: metrics, isLoading, error } = useQueueMetrics();

  if (isLoading) return <div>Loading queue metrics...</div>;
  if (error) return <div>Error loading queue metrics: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Queue Status Monitor</h1>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics?.map((queue: any) => (
          <Card key={queue.queue_name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {queue.queue_name.replace(/-/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queue.active + queue.waiting}</div>
              <p className="text-xs text-muted-foreground">
                {queue.waiting} waiting, {queue.active} active
              </p>
              <div className="flex justify-between text-xs text-muted-foreground pt-2">
                <span>Completed: {queue.completed}</span>
                <span className="text-red-500">Failed: {queue.failed}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Historical Queue Metrics (Sample)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sampleHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="waiting" stroke="#8884d8" name="Waiting" />
              <Line type="monotone" dataKey="active" stroke="#82ca9d" name="Active" />
              <Line type="monotone" dataKey="failed" stroke="#ffc658" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 