"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RefreshCw, Activity, Server, AlertTriangle, Database, Clock, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Mock data - in production this would come from your backend
const transactionVolumeData = [
  { name: '00:00', total: 58, success: 56, failed: 2 },
  { name: '03:00', total: 42, success: 40, failed: 2 },
  { name: '06:00', total: 35, success: 34, failed: 1 },
  { name: '09:00', total: 80, success: 78, failed: 2 },
  { name: '12:00', total: 120, success: 118, failed: 2 },
  { name: '15:00', total: 105, success: 102, failed: 3 },
  { name: '18:00', total: 95, success: 93, failed: 2 },
  { name: '21:00', total: 65, success: 63, failed: 2 },
];

const gatewayPerformanceData = [
  { name: 'Razorpay', success: 99.5, volume: 450, responseTime: 280 },
  { name: 'PhonePe', success: 98.9, volume: 320, responseTime: 310 },
  { name: 'Paytm', success: 99.2, volume: 280, responseTime: 290 },
  { name: 'Stripe', success: 99.8, volume: 150, responseTime: 250 },
  { name: 'PayPal', success: 99.3, volume: 120, responseTime: 350 },
];

const errorDistributionData = [
  { name: 'Gateway Timeout', value: 35, color: '#F87171' },
  { name: 'Network Error', value: 25, color: '#FBBF24' },
  { name: 'Authentication Failed', value: 20, color: '#60A5FA' },
  { name: 'Invalid Request', value: 15, color: '#34D399' },
  { name: 'Other', value: 5, color: '#A78BFA' },
];

const backgroundJobsData = [
  { name: 'Transaction Monitoring', status: 'healthy', lastRun: '10 min ago', duration: '45s' },
  { name: 'Gateway Health Check', status: 'healthy', lastRun: '5 min ago', duration: '30s' },
  { name: 'Settlement Processing', status: 'warning', lastRun: '30 min ago', duration: '2m 15s' },
  { name: 'Alert Generation', status: 'healthy', lastRun: '12 min ago', duration: '28s' },
  { name: 'Webhook Processing', status: 'healthy', lastRun: '3 min ago', duration: '52s' },
];

const systemStatusData = [
  { name: 'API Service', value: '99.98%', status: 'healthy', load: 42, icon: Activity },
  { name: 'Database', value: '99.99%', status: 'healthy', load: 38, icon: Database },
  { name: 'Background Jobs', value: '99.95%', status: 'warning', load: 65, icon: Clock },
  { name: 'Gateway Connectivity', value: '99.97%', status: 'healthy', load: 51, icon: Radio },
];

const recentAlertsData = [
  { id: 'ALT12345', level: 'warning', message: 'Increased error rate on PhonePe gateway', time: '15 min ago' },
  { id: 'ALT12346', level: 'critical', message: 'Settlement processing job taking longer than usual', time: '30 min ago' },
  { id: 'ALT12347', level: 'info', message: 'Daily transaction volume 20% higher than average', time: '1 hour ago' },
  { id: 'ALT12348', level: 'warning', message: 'API response time increased by 15%', time: '2 hours ago' },
];

export default function AdminMonitoringDashboard() {
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
          <h1 className="text-3xl font-bold">System Monitoring</h1>
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

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemStatusData.map((item) => (
          <Card key={item.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{item.name}</h3>
                </div>
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
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">Uptime</p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Current Load</span>
                  <span>{item.load}%</span>
                </div>
                <Progress value={item.load} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Transaction Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Hourly transaction volume with success/failure breakdown</CardDescription>
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
                    <Bar dataKey="success" stackId="a" fill="#10B981" name="Successful" />
                    <Bar dataKey="failed" stackId="a" fill="#F87171" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Error Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
              <CardDescription>Breakdown of transaction errors by type</CardDescription>
            </CardHeader>
            <CardContent className="flex">
              <div className="h-80 w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {errorDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 pl-8 flex flex-col justify-center">
                <h4 className="text-lg font-medium mb-4">Error Insights</h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                    <span>Gateway timeouts increased by 5% since yesterday</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                    <span>Network errors peak during high traffic periods</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                    <span>Authentication failures concentrated on specific merchants</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-6">
          {/* Gateway Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Gateway Performance</CardTitle>
              <CardDescription>Success rates and response times across payment gateways</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Gateway</th>
                      <th className="text-left py-3 px-4">Success Rate</th>
                      <th className="text-left py-3 px-4">Avg. Response Time</th>
                      <th className="text-left py-3 px-4">Transaction Volume</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gatewayPerformanceData.map((gateway) => (
                      <tr key={gateway.name} className="border-b">
                        <td className="py-3 px-4 font-medium">{gateway.name}</td>
                        <td className="py-3 px-4">{gateway.success}%</td>
                        <td className="py-3 px-4">{gateway.responseTime}ms</td>
                        <td className="py-3 px-4">{gateway.volume}</td>
                        <td className="py-3 px-4">
                          {gateway.success > 99.5 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Excellent
                            </Badge>
                          ) : gateway.success > 99.0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Good
                            </Badge>
                          ) : gateway.success > 98.0 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Fair
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Poor
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Gateway Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gateway Response Times</CardTitle>
              <CardDescription>Average response times by gateway over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transactionVolumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" name="All Gateways" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Background Jobs Status */}
          <Card>
            <CardHeader>
              <CardTitle>Background Jobs</CardTitle>
              <CardDescription>Status of system background jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Job Name</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Last Run</th>
                      <th className="text-left py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backgroundJobsData.map((job) => (
                      <tr key={job.name} className="border-b">
                        <td className="py-3 px-4 font-medium">{job.name}</td>
                        <td className="py-3 px-4">
                          {job.status === 'healthy' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Healthy
                            </Badge>
                          ) : job.status === 'warning' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{job.lastRun}</td>
                        <td className="py-3 px-4">{job.duration}</td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm">
                            Trigger Now
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Job Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle>Job Queues</CardTitle>
              <CardDescription>Status of background job queues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Transaction Processing Queue</span>
                    <span>12 jobs waiting</span>
                  </div>
                  <Progress value={12} max={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Webhook Delivery Queue</span>
                    <span>5 jobs waiting</span>
                  </div>
                  <Progress value={5} max={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Settlement Processing Queue</span>
                    <span>28 jobs waiting</span>
                  </div>
                  <Progress value={28} max={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Alert Generation Queue</span>
                    <span>3 jobs waiting</span>
                  </div>
                  <Progress value={3} max={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Alert ID</th>
                      <th className="text-left py-3 px-4">Level</th>
                      <th className="text-left py-3 px-4">Message</th>
                      <th className="text-left py-3 px-4">Time</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAlertsData.map((alert) => (
                      <tr key={alert.id} className="border-b">
                        <td className="py-3 px-4">{alert.id}</td>
                        <td className="py-3 px-4">
                          {alert.level === 'info' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Info
                            </Badge>
                          ) : alert.level === 'warning' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Critical
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{alert.message}</td>
                        <td className="py-3 px-4">{alert.time}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Acknowledge
                            </Button>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Configure system alert thresholds and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Email Notifications</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Slack Notifications</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SMS Notifications</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>In-App Notifications</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Alert Thresholds</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Error Rate</span>
                      <span>{'>'} 5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Response Time</span>
                      <span>{'>'} 500ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Gateway Success Rate</span>
                      <span>{'<'} 98%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Job Queue Depth</span>
                      <span>{'>'} 50 jobs</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
