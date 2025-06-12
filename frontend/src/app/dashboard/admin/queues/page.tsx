"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useQueueMetrics } from "@/hooks/api";
import { useState } from "react";

export default function QueueMonitor() {
  const { data: metrics, isLoading } = useQueueMetrics();
  const [actionPending, setActionPending] = useState<string | null>(null);

  if (isLoading) return <div className="p-6">Loading...</div>;

  const drainQueue = async (queue_name: string) => {
    setActionPending(queue_name);
    try {
      await fetch(`/api/admin/queues/drain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_name }),
      });
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Queue Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics?.map((queue: any) => (
          <Card key={queue.queue_name}>
            <CardHeader>
              <CardTitle>{queue.queue_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Waiting: {queue.waiting}</div>
              <div>Active: {queue.active}</div>
              <div>Failed: {queue.failed}</div>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionPending === queue.queue_name}
                onClick={() => drainQueue(queue.queue_name)}
              >
                {actionPending === queue.queue_name ? "Draining..." : "Drain Queue"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics && metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <XAxis dataKey="queue_name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="waiting" stroke="#8884d8" />
                <Line type="monotone" dataKey="active" stroke="#82ca9d" />
                <Line type="monotone" dataKey="failed" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 