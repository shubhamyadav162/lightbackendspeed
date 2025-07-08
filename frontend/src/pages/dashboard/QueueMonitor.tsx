import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// TODO: Replace with real data from useQueueMetrics hook
const demoQueueStats = [
  { queue_name: 'transaction-processing', waiting: 120, active: 25, completed: 5230, failed: 15 },
  { queue_name: 'webhook-processing', waiting: 80, active: 48, completed: 8940, failed: 5 },
  { queue_name: 'whatsapp-notifications', waiting: 5, active: 1, completed: 1500, failed: 0 },
];

const demoChartData = [
  { time: '10:00', waiting: 110, active: 20 },
  { time: '10:05', waiting: 130, active: 22 },
  { time: '10:10', waiting: 90, active: 25 },
  { time: '10:15', waiting: 120, active: 24 },
  { time: '10:20', waiting: 150, active: 25 },
];

export function QueueMonitor() {
  // const { data: queueStats, isLoading, error } = useQueueMetrics(); // Future implementation

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Queue Status</CardTitle>
          <CardDescription>Real-time metrics for all background job queues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoQueueStats.map(queue => (
              <Card key={queue.queue_name}>
                <CardHeader>
                  <CardTitle className="text-lg">{queue.queue_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span>Waiting:</span> <strong>{queue.waiting}</strong></div>
                  <div className="flex justify-between"><span>Active:</span> <strong>{queue.active}</strong></div>
                  <div className="flex justify-between"><span>Completed:</span> <strong>{queue.completed}</strong></div>
                  <div className={`flex justify-between ${queue.failed > 0 ? 'text-red-600' : ''}`}>
                    <span>Failed:</span> <strong>{queue.failed}</strong>
                  </div>
                   <div className="pt-2">
                     <Button variant="destructive" size="sm" onClick={() => console.log(`Draining ${queue.queue_name}`)}>Drain Queue</Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Queue Performance</CardTitle>
           <CardDescription>Waiting jobs over the last 20 minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={demoChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="waiting" stroke="#8884d8" name="Waiting Jobs" />
              <Line type="monotone" dataKey="active" stroke="#82ca9d" name="Active Jobs" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 