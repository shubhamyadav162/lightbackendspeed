
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Key, Users, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

export const SecurityConfig = () => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    encryptionEnabled: true,
    ipWhitelisting: false,
    sessionTimeout: true,
    auditLogging: true,
    bruteForceProtection: true,
    dataRetention: false,
    webhookSecurity: true
  });

  const [apiKeys] = useState([
    { id: 1, name: 'Production API', key: 'sk_live_****1234', created: '2024-01-15', lastUsed: '2024-06-10', status: 'active' },
    { id: 2, name: 'Development API', key: 'sk_test_****5678', created: '2024-02-20', lastUsed: '2024-06-09', status: 'active' },
    { id: 3, name: 'Backup API', key: 'sk_live_****9012', created: '2024-03-10', lastUsed: '2024-06-01', status: 'inactive' }
  ]);

  const [auditLogs] = useState([
    { id: 1, action: 'User Login', user: 'admin@company.com', ip: '192.168.1.100', timestamp: '2024-06-10 16:30:00', status: 'success' },
    { id: 2, action: 'API Key Generated', user: 'admin@company.com', ip: '192.168.1.100', timestamp: '2024-06-10 15:45:00', status: 'success' },
    { id: 3, action: 'Failed Login Attempt', user: 'unknown@example.com', ip: '203.0.113.42', timestamp: '2024-06-10 14:20:00', status: 'failed' },
    { id: 4, action: 'Password Changed', user: 'admin@company.com', ip: '192.168.1.100', timestamp: '2024-06-10 12:10:00', status: 'success' }
  ]);

  const toggleSetting = (setting: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const regenerateApiKey = (keyId: number) => {
    alert(`API Key ${keyId} regenerated successfully!`);
  };

  const revokeApiKey = (keyId: number) => {
    alert(`API Key ${keyId} revoked successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security & Configuration</h1>
          <p className="text-gray-600">Manage security settings, API keys, and system configuration</p>
        </div>
        <Button>
          <Shield className="w-4 h-4 mr-2" />
          Security Audit
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92%</div>
            <p className="text-xs text-muted-foreground">Excellent security level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter(key => key.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">2 active, 1 inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Current active sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Authentication</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Two-Factor Authentication</label>
                      <p className="text-xs text-gray-500">Require 2FA for all admin users</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={() => toggleSetting('twoFactorAuth')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Session Timeout</label>
                      <p className="text-xs text-gray-500">Auto-logout after 30 minutes</p>
                    </div>
                    <Switch 
                      checked={securitySettings.sessionTimeout}
                      onCheckedChange={() => toggleSetting('sessionTimeout')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Data Protection</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Encryption Enabled</label>
                      <p className="text-xs text-gray-500">Encrypt all data at rest</p>
                    </div>
                    <Switch 
                      checked={securitySettings.encryptionEnabled}
                      onCheckedChange={() => toggleSetting('encryptionEnabled')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Data Retention</label>
                      <p className="text-xs text-gray-500">Auto-delete old data</p>
                    </div>
                    <Switch 
                      checked={securitySettings.dataRetention}
                      onCheckedChange={() => toggleSetting('dataRetention')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Access Control</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">IP Whitelisting</label>
                      <p className="text-xs text-gray-500">Restrict access by IP</p>
                    </div>
                    <Switch 
                      checked={securitySettings.ipWhitelisting}
                      onCheckedChange={() => toggleSetting('ipWhitelisting')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Brute Force Protection</label>
                      <p className="text-xs text-gray-500">Block suspicious login attempts</p>
                    </div>
                    <Switch 
                      checked={securitySettings.bruteForceProtection}
                      onCheckedChange={() => toggleSetting('bruteForceProtection')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                      {apiKey.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-mono mb-2">{apiKey.key}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Created: {apiKey.created}</p>
                    <p>Last used: {apiKey.lastUsed}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => regenerateApiKey(apiKey.id)}>
                      Regenerate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => revokeApiKey(apiKey.id)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
              <Button className="w-full">Generate New API Key</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {log.status}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
