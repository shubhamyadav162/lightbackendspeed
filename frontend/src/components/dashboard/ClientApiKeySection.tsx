import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Key, Shield, Link, Eye, EyeOff } from 'lucide-react';
import { Client } from '@/types/client';
import { toast } from 'sonner';

interface ClientApiKeySectionProps {
  filteredClients: Client[];
  regenerateApiKey: (clientId: string) => void;
}

export const ClientApiKeySection: React.FC<ClientApiKeySectionProps> = ({
  filteredClients,
  regenerateApiKey
}) => {
  const [visibleCredentials, setVisibleCredentials] = React.useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const toggleVisibility = (clientId: string) => {
    setVisibleCredentials(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const maskCredential = (credential: string, visible: boolean) => {
    if (visible) return credential;
    return credential.substring(0, 8) + '•'.repeat(20) + credential.substring(credential.length - 4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>LightSpeedPay API Credentials</span>
          <Badge variant="secondary" className="ml-2">Key-Salt Wrapper System</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Each client gets a single set of credentials that routes to 20+ payment gateways
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredClients.map((client) => {
            const isVisible = visibleCredentials[client.id] || false;
            const webhookUrl = client.webhook_url || `https://api.lightspeedpay.com/webhook/${client.client_key}`;
            
            return (
              <div key={client.id} className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{client.company}</h3>
                    <p className="text-sm text-gray-600">Client ID: {client.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleVisibility(client.id)}
                    >
                      {isVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {isVisible ? 'Hide' : 'Show'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => regenerateApiKey(client.id)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Regenerate All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Client Key */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <span>Client Key</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={maskCredential(client.client_key || client.apiKey || '', isVisible)} 
                        readOnly 
                        className="font-mono text-sm bg-white" 
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard(client.client_key || client.apiKey || '', 'Client Key')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Use this for API authentication</p>
                  </div>

                  {/* Client Salt */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Client Salt</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={maskCredential(client.client_salt || 'salt_generated_automatically', isVisible)} 
                        readOnly 
                        className="font-mono text-sm bg-white" 
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard(client.client_salt || 'salt_generated_automatically', 'Client Salt')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Use this for HMAC signature</p>
                  </div>

                  {/* Webhook Endpoint */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Link className="w-4 h-4 text-purple-600" />
                      <span>Webhook Endpoint</span>
                      <Badge variant="outline" className="text-xs">Auto-Generated</Badge>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={webhookUrl} 
                        readOnly 
                        className="font-mono text-sm bg-white" 
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Receives payment notifications</p>
                  </div>
                </div>

                {/* Gateway Count Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-600 text-white">Key-Salt Wrapper Active</Badge>
                      <span className="text-sm text-blue-800">
                        These credentials route to <strong>20+ payment gateways</strong>
                      </span>
                    </div>
                    <div className="text-sm text-blue-600">
                      Active Gateways: <strong>5/20</strong>
                    </div>
                  </div>
                </div>

                {/* Integration Example */}
                {isVisible && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Integration Example:</h4>
                    <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`curl -X POST https://api.lightspeedpay.com/payment/initiate \\
  -H "X-Client-Key: ${client.client_key || client.apiKey || 'your_client_key'}" \\
  -H "X-Client-Salt: ${client.client_salt || 'your_client_salt'}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 10000, "order_id": "ORDER_123"}'`}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
