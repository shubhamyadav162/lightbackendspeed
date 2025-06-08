import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { DatePickerWithRange } from '../date-range-picker';
import { Button } from '../button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { useTransactionService } from '@/hooks/use-transaction-service';

// Types for analytics data
type TimeSeriesData = {
  date: string;
  value: number;
  category?: string;
};

type PieChartData = {
  name: string;
  value: number;
};

type AnalyticsMetrics = {
  totalTransactions: number;
  successRate: number;
  averageAmount: number;
  totalVolume: number;
  failureByReason: PieChartData[];
  transactionsByGateway: PieChartData[];
  transactionsByDay: TimeSeriesData[];
  transactionsByHour: TimeSeriesData[];
};

const MOCK_DATA: AnalyticsMetrics = {
  totalTransactions: 1248,
  successRate: 94.2,
  averageAmount: 1423.65,
  totalVolume: 1776912.20,
  failureByReason: [
    { name: 'Insufficient Funds', value: 42 },
    { name: 'Card Declined', value: 18 },
    { name: 'Network Error', value: 7 },
    { name: 'Timeout', value: 5 },
    { name: 'Other', value: 1 },
  ],
  transactionsByGateway: [
    { name: 'Razorpay', value: 598 },
    { name: 'PhonePe', value: 423 },
    { name: 'Sandbox', value: 227 },
  ],
  transactionsByDay: Array(30).fill(0).map((_, i) => ({
    date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    value: Math.floor(Math.random() * 100) + 20,
  })),
  transactionsByHour: Array(24).fill(0).map((_, i) => ({
    date: `${String(i).padStart(2, '0')}:00`,
    value: Math.floor(Math.random() * 30) + 5,
  })),
};

// Color schemes
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [gateway, setGateway] = useState<string>('all');
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const transactionService = useTransactionService();

  // In a real implementation, we would fetch data from the API based on filters
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!dateRange) return;
      
      setIsLoading(true);
      try {
        // This would be replaced with actual API call in production
        // const data = await transactionService.getAnalytics({
        //   fromDate: dateRange.from,
        //   toDate: dateRange.to,
        //   gateway: gateway !== 'all' ? gateway : undefined
        // });
        // setMetrics(data);
        
        // Simulating API delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, gateway]);

  const handleExportData = () => {
    // Implementation for exporting data as CSV
    const jsonData = JSON.stringify(metrics, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Transaction Analytics</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <DatePickerWithRange className="w-full sm:w-auto" onChange={setDateRange} />
          
          <Select value={gateway} onValueChange={setGateway}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gateways</SelectItem>
              <SelectItem value="razorpay">Razorpay</SelectItem>
              <SelectItem value="phonepe">PhonePe</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2" onClick={handleExportData}>
            <Download size={16} />
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalTransactions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl">{metrics.successRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Amount</CardDescription>
            <CardTitle className="text-3xl">₹{metrics.averageAmount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Volume</CardDescription>
            <CardTitle className="text-3xl">₹{metrics.totalVolume.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Tabs for different visualizations */}
      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Time Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Transaction Volume</CardTitle>
                <CardDescription>Number of transactions processed per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.transactionsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return `Date: ${date.toLocaleDateString()}`;
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Transactions" stroke="#0088FE" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hourly Transaction Pattern</CardTitle>
                <CardDescription>Number of transactions by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.transactionsByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Transactions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Transactions by Gateway</CardTitle>
              <CardDescription>Distribution of transactions across payment gateways</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.transactionsByGateway}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.transactionsByGateway.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} transactions`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle>Failed Transactions by Reason</CardTitle>
              <CardDescription>Analysis of transaction failures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.failureByReason}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.failureByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} failures`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard; 