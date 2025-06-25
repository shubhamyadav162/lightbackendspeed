
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';

export const AlertCenterScreen = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'error',
      title: 'Gateway Connection Failed',
      message: 'Stripe gateway is experiencing connectivity issues',
      timestamp: '2024-06-10 16:45',
      read: false,
      severity: 'high'
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Transaction Volume',
      message: 'Unusual spike in transaction volume detected',
      timestamp: '2024-06-10 15:30',
      read: false,
      severity: 'medium'
    },
    {
      id: 3,
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'PayPal gateway maintenance scheduled for tonight',
      timestamp: '2024-06-10 14:15',
      read: true,
      severity: 'low'
    },
    {
      id: 4,
      type: 'success',
      title: 'System Update Complete',
      message: 'All gateways updated successfully',
      timestamp: '2024-06-10 12:00',
      read: true,
      severity: 'low'
    }
  ]);

  const [alertSettings, setAlertSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    systemErrors: true,
    highVolume: true,
    lowBalance: true,
    maintenanceAlerts: false
  });

  const markAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const toggleSetting = (setting: string) => {
    setAlertSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
          <p className="text-gray-600">Monitor system alerts and configure notification preferences</p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Alert Settings
        </Button>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(alert => !alert.read).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(alert => alert.severity === 'high').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">8</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${!alert.read ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{alert.timestamp}</p>
                      <div className="flex space-x-2 mt-3">
                        {!alert.read && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead(alert.id)}>
                            Mark as Read
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Email Alerts</label>
                    <Switch 
                      checked={alertSettings.emailAlerts}
                      onCheckedChange={() => toggleSetting('emailAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">SMS Alerts</label>
                    <Switch 
                      checked={alertSettings.smsAlerts}
                      onCheckedChange={() => toggleSetting('smsAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Push Notifications</label>
                    <Switch 
                      checked={alertSettings.pushNotifications}
                      onCheckedChange={() => toggleSetting('pushNotifications')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">System Errors</label>
                    <Switch 
                      checked={alertSettings.systemErrors}
                      onCheckedChange={() => toggleSetting('systemErrors')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">High Volume</label>
                    <Switch 
                      checked={alertSettings.highVolume}
                      onCheckedChange={() => toggleSetting('highVolume')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Low Balance</label>
                    <Switch 
                      checked={alertSettings.lowBalance}
                      onCheckedChange={() => toggleSetting('lowBalance')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Maintenance Alerts</label>
                    <Switch 
                      checked={alertSettings.maintenanceAlerts}
                      onCheckedChange={() => toggleSetting('maintenanceAlerts')}
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full">Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
