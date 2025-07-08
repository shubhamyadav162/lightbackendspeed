import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalytics } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DollarSign, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { data: analytics, isLoading, error } = useAnalytics(); // System-wide analytics

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading analytics: {error.message}</div>;
  }

  const { stats, totals } = analytics?.data || { stats: [], totals: {} };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals?.total_amount?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">in the selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totals?.total_count?.toLocaleString() || '0'}</div>
             <p className="text-xs text-muted-foreground">completed: {totals?.completed_count?.toLocaleString() || '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals?.total_count > 0 
                ? ((totals.completed_count / totals.total_count) * 100).toFixed(2) 
                : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">across all transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.failed_count?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">in the selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_amount" name="Volume (INR)" stroke="#8884d8" />
              <Line type="monotone" dataKey="total_count" name="Transactions" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 
        The following sections are commented out because the new analytics API 
        endpoint (/api/v1/analytics) currently provides only aggregate stats 
        and time-series data. It does not return gateway-specific performance
        or recent high-value transactions. This may be added in a future update.
      */}

      {/* Gateway Performance */}
      {/*
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gateway Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gateway_performance?.map((gw: any) => (
                  <TableRow key={gw.gateway_name}>
                    <TableCell>{gw.gateway_name}</TableCell>
                    <TableCell>{gw.success_rate.toFixed(2)}%</TableCell>
                    <TableCell>₹{gw.total_volume_inr.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Value Transactions</CardTitle>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_high_value?.map((txn: any) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.client_name}</TableCell>
                    <TableCell>₹{txn.amount_inr.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={txn.status === 'COMPLETED' ? 'default' : 'destructive'}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}; 