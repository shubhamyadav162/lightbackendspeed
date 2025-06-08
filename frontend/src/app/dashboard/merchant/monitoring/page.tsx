"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RefreshCw, Clock, Banknote, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data - in production this would come from your backend
const transactionVolumeData = [
  { name: '00:00', volume: 12 },
  { name: '03:00', volume: 8 },
  { name: '06:00', volume: 5 },
  { name: '09:00', volume: 17 },
  { name: '12:00', volume: 30 },
  { name: '15:00', volume: 25 },
  { name: '18:00', volume: 22 },
  { name: '21:00', volume: 15 },
];

const successRateData = [
  { name: '00:00', rate: 98.2 },
  { name: '03:00', rate: 99.5 },
  { name: '06:00', rate: 97.8 },
  { name: '09:00', rate: 98.9 },
  { name: '12:00', rate: 99.2 },
  { name: '15:00', rate: 99.7 },
  { name: '18:00', rate: 98.4 },
  { name: '21:00', rate: 99.1 },
];

const paymentMethodData = [
  { name: 'Credit Card', value: 45, color: '#60A5FA' },
  { name: 'UPI', value: 30, color: '#34D399' },
  { name: 'Net Banking', value: 15, color: '#FBBF24' },
  { name: 'Wallet', value: 10, color: '#F87171' },
];

const recentTransactionsData = [
  { id: 'TXN123456', amount: '₹5,000.00', date: '2023-08-10 15:30', status: 'success', gateway: 'Razorpay' },
  { id: 'TXN123457', amount: '₹1,200.00', date: '2023-08-10 14:22', status: 'success', gateway: 'PhonePe' },
  { id: 'TXN123458', amount: '₹3,500.00', date: '2023-08-10 13:15', status: 'failed', gateway: 'Paytm' },
  { id: 'TXN123459', amount: '₹800.00', date: '2023-08-10 12:48', status: 'success', gateway: 'Razorpay' },
  { id: 'TXN123460', amount: '₹6,700.00', date: '2023-08-10 11:30', status: 'success', gateway: 'PhonePe' },
];

const merchantStatusData = [
  { name: 'Transaction Success Rate', value: '99.2%', status: 'healthy', icon: Banknote },
  { name: 'API Health', value: 'Operational', status: 'healthy', icon: Clock },
  { name: 'Recent Alerts', value: '0', status: 'healthy', icon: AlertTriangle },
];

export default function MerchantMonitoringDashboard() {
  const [timeRange, setTimeRange] = useState("24h");
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const handleRefresh = () => {
    // In a real application, this would fetch fresh data
    setLastUpdated(new Date().toLocaleTimeString());
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transaction Monitoring</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {merchantStatusData.map((item) => (
          <Card key={item.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
                  <h3 className="text-2xl font-bold mt-1">{item.value}</h3>
                  <p className="text-sm mt-2">
                    {item.status === 'healthy' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Healthy
                      </Badge>
                    ) : item.status === 'warning' ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Warning
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Critical
                      </Badge>
                    )}
                  </p>
                </div>
                <item.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Transaction Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Hourly transaction volume over the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionVolumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="volume" fill="#3B82F6" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate</CardTitle>
              <CardDescription>Percentage of successful transactions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={successRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[95, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#10B981" name="Success Rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest transactions processed by your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Transaction ID</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Date & Time</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Gateway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactionsData.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3 px-4">{transaction.id}</td>
                        <td className="py-3 px-4">{transaction.amount}</td>
                        <td className="py-3 px-4">{transaction.date}</td>
                        <td className="py-3 px-4">
                          {transaction.status === 'success' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Success
                            </Badge>
                          ) : transaction.status === 'pending' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{transaction.gateway}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          {/* Payment Methods Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of transactions by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
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
}
