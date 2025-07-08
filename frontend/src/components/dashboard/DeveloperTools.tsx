import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, Zap, FileText, BarChart3, RefreshCw, Play, CheckCircle, XCircle, Eye, Code, History } from 'lucide-react';
import { toast } from 'sonner';
import { useMerchants, useMerchantCredentials, useRegenerateCredentials, useMerchantUsage, useTestWebhook, useCredentialHistory } from '@/hooks/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DeveloperTools = () => {
  // Component State
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  
  // Hooks
  const { data: merchants, isLoading: merchantsLoading } = useMerchants();
  const { data: fetchedCreds, isLoading: credsLoading } = useMerchantCredentials(selectedMerchantId);
  const { data: usageData } = useMerchantUsage(selectedMerchantId);
  const { data: historyData, isLoading: historyLoading } = useCredentialHistory(selectedMerchantId);
  const regenerateMutation = useRegenerateCredentials();
  const testWebhookMutation = useTestWebhook();

  // Local state fallback initialization now checks fetchedCreds
  const [apiCredentials, setApiCredentials] = useState({
    client_key: '',
    webhook_url: '',
    fee_percent: 0,
    rate_limit: 0,
  });

  // Update state when new creds arrive
  useEffect(() => {
    if (fetchedCreds?.data) {
      setApiCredentials(fetchedCreds.data);
      if (fetchedCreds.data.webhook_url) {
        setWebhookUrl(fetchedCreds.data.webhook_url);
      }
    } else {
      // Reset when no merchant is selected or data is not available
      setApiCredentials({ client_key: '', webhook_url: '', fee_percent: 0, rate_limit: 0 });
    }
  }, [fetchedCreds]);

  const [webhookUrl, setWebhookUrl] = useState('https://your-domain.com/webhook');
  const [selectedEvents, setSelectedEvents] = useState({
    payment_success: true,
    payment_failed: true,
    refund: false,
    subscription_created: false,
    subscription_cancelled: false,
    chargeback: true
  });

  const [showCredentials, setShowCredentials] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const generateNewCredentials = () => {
    if (!selectedMerchantId) {
      toast.error('Please select a merchant first.');
      return;
    }
    if (!label) {
      toast.error('Please provide a label for the new credentials.');
      return;
    }
    regenerateMutation.mutate({ merchantId: selectedMerchantId, label }, {
      onSuccess: (data) => {
        toast.success('New API credentials generated!');
        if(data?.data) {
          setApiCredentials(data.data);
        }
        setLabel(''); // Reset label after generation
      },
      onError: () => {
        toast.error('Failed to regenerate credentials.');
      }
    });
  };

  const testWebhook = () => {
    if (!selectedMerchantId) {
      toast.error('Please select a merchant first.');
      return;
    }
    testWebhookMutation.mutate({ url: webhookUrl, merchantId: selectedMerchantId }, {
      onSuccess: () => toast.success('Webhook test sent successfully!'),
      onError: () => toast.error('Webhook test failed'),
    });
  };

  const retryFailedWebhooks = () => {
    toast.success('Retrying failed webhooks...');
  };

  const webhookLogs = [
    { id: 1, event: 'payment_success', url: webhookUrl, status: 'success', timestamp: '2024-06-10 16:45:23', responseTime: '120ms' },
    { id: 2, event: 'payment_failed', url: webhookUrl, status: 'failed', timestamp: '2024-06-10 16:44:12', responseTime: '5000ms' },
    { id: 3, event: 'refund', url: webhookUrl, status: 'success', timestamp: '2024-06-10 16:42:55', responseTime: '95ms' }
  ];

  const codeExamples = {
    php: `<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.lightspeed.com/v1/payments',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => json_encode([
    'amount' => 1000,
    'currency' => 'USD',
    'customer_id' => 'cust_123'
  ]),
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer ' . $apiCredentials.client_key,
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;`,
    javascript: `const response = await fetch('https://api.lightspeed.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiCredentials.client_key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'USD',
    customer_id: 'cust_123'
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests
import json

url = "https://api.lightspeed.com/v1/payments"
payload = {
    "amount": 1000,
    "currency": "USD",
    "customer_id": "cust_123"
}
headers = {
    "Authorization": f"Bearer {apiCredentials.client_key}",
    "Content-Type": "application/json"
}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())`,
    curl: `curl -X POST https://api.lightspeed.com/v1/payments \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "currency": "USD",
    "customer_id": "cust_123"
  }'`
  };

  const apiStats = usageData || {
    callsThisMonth: 0,
    successRate: 0,
    mostUsedEndpoint: 'N/A',
    usageLimit: 50000,
    currentUsage: 0
  };

  const recentActivity = [
    { endpoint: '/v1/payments', method: 'POST', status: 200, timestamp: '16:45:23', responseTime: '120ms' },
    { endpoint: '/v1/customers', method: 'GET', status: 200, timestamp: '16:44:12', responseTime: '89ms' },
    { endpoint: '/v1/refunds', method: 'POST', status: 201, timestamp: '16:42:55', responseTime: '156ms' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Tools</h1>
          <p className="text-gray-600">Manage API credentials, webhooks, and integration tools for a specific merchant.</p>
        </div>
        <div className="w-64">
           <Select onValueChange={setSelectedMerchantId} value={selectedMerchantId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a Merchant..." />
            </SelectTrigger>
            <SelectContent>
              {merchantsLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
              {merchants?.data?.map((merchant: any) => (
                <SelectItem key={merchant.id} value={merchant.id}>
                  {merchant.merchant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedMerchantId ? (
        <Card className="flex items-center justify-center h-64">
            <div className="text-center">
                <p className="text-lg font-semibold">Please select a merchant</p>
                <p className="text-sm text-gray-500">Select a merchant from the dropdown above to view their developer tools.</p>
            </div>
        </Card>
      ) : (
      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credentials">API Credentials</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="font-medium">Environment Settings</h3>
                  <div className="flex items-center space-x-4">
                     <p className="text-sm text-gray-600">
                      Status: {credsLoading ? "Loading..." : (apiCredentials.client_key ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-red-100 text-red-800">Inactive</Badge>)}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate API Credentials</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will generate new credentials and invalidate the current ones. This action cannot be undone. Please provide a descriptive label for auditing purposes.
                      </AlertDialogDescription>
                      <div className="pt-2">
                        <label htmlFor="cred-label" className="text-sm font-medium">Label</label>
                        <Input 
                          id="cred-label"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          placeholder="e.g., 'Production Key for new Website'"
                        />
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={generateNewCredentials}>Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-4">
                <Button onClick={() => setShowCredentials(!showCredentials)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showCredentials ? 'Hide' : 'Show'} Credentials
                </Button>

                {showCredentials && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Client Key</label>
                        <div className="flex">
                          <Input value={apiCredentials.client_key} readOnly className="font-mono text-sm" />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="ml-2"
                            onClick={() => copyToClipboard(apiCredentials.client_key, 'Client Key')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Webhook URL</label>
                         <div className="flex">
                           <Input value={apiCredentials.webhook_url} readOnly className="font-mono text-sm" />
                           <Button
                             size="sm"
                             variant="outline"
                             className="ml-2"
                             onClick={() => copyToClipboard(apiCredentials.webhook_url, 'Webhook URL')}
                           >
                             <Copy className="w-4 h-4" />
                           </Button>
                         </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Fee Percent</label>
                         <div className="flex">
                           <Input value={`${apiCredentials.fee_percent}%`} readOnly className="font-mono text-sm" />
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Credential History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Client Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading history...</TableCell>
                    </TableRow>
                  ) : (
                    historyData?.data?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="font-mono text-sm">{item.client_key.substring(0, 8)}...{item.client_key.substring(item.client_key.length - 4)}</TableCell>
                        <TableCell>
                          {item.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="outline">Revoked</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {!historyLoading && historyData?.data?.length === 0 && (
                     <TableRow>
                      <TableCell colSpan={4} className="text-center">No credential history for this merchant.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook URL</label>
                  <div className="flex">
                    <Input 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-domain.com/webhook"
                    />
                    <Button onClick={testWebhook} className="ml-2">
                      <Play className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedEvents).map(([event, checked]) => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setSelectedEvents({...selectedEvents, [event]: e.target.checked})}
                          className="rounded"
                        />
                        <label className="text-sm">{event.replace('_', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Webhook Logs</CardTitle>
              <Button onClick={retryFailedWebhooks} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Failed
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.event}</TableCell>
                      <TableCell>
                        {log.status === 'success' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.responseTime}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation & Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="php" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(code, `${lang.toUpperCase()} code`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Integration Steps</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Generate your API credentials from the credentials tab</li>
                  <li>Set up your webhook endpoint to receive notifications</li>
                  <li>Subscribe to the events you want to receive</li>
                  <li>Make your first API call using the examples above</li>
                  <li>Test your integration in sandbox mode</li>
                  <li>Switch to live mode when ready</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls This Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(apiStats.callsThisMonth || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(apiStats.successRate || 0)}%</div>
                <p className="text-xs text-muted-foreground">+0.3% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Used Endpoint</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{apiStats.mostUsedEndpoint}</div>
                <p className="text-xs text-muted-foreground">8,934 calls this month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Calls</span>
                  <span>{(apiStats.currentUsage || 0).toLocaleString()} / {(apiStats.usageLimit || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${((apiStats.currentUsage || 0) / (apiStats.usageLimit || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent API Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{activity.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={activity.status === 200 || activity.status === 201 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{activity.responseTime}</TableCell>
                      <TableCell>{activity.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};
