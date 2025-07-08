import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// TODO: Replace with real data for the logged-in merchant
const demoCredentials = {
  client_key: 'lsp_live_demo_4xA9dKj7mN8qP2wE',
  client_salt: 'salt_demo_8F3kL9mX2nQ5tW7yZ1bV4cD6eG0hJ8iK',
  webhook_url: 'https://api.lightspeedpay.com/webhook/lsp_live_demo_4xA9dKj7mN8qP2wE',
};

export function IntegrationCenter() {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleRegenerate = () => {
    toast.warning('This will invalidate your old credentials. Are you sure?', {
      action: {
        label: 'Confirm',
        onClick: () => {
          // TODO: Call API to regenerate keys
          toast.success('Credentials regenerated successfully!');
        },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Integration Credentials</CardTitle>
        <CardDescription>
          Use these keys to integrate your application with the LightSpeedPay API.
          Keep your salt secure and never expose it on the client-side.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Client Key</label>
          <div className="flex items-center space-x-2">
            <Input readOnly value={demoCredentials.client_key} />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(demoCredentials.client_key, 'Client Key')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Client Salt</label>
          <div className="flex items-center space-x-2">
            <Input readOnly type="password" value={demoCredentials.client_salt} />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(demoCredentials.client_salt, 'Client Salt')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
         <div className="space-y-2">
          <label className="text-sm font-medium">Webhook URL</label>
          <div className="flex items-center space-x-2">
            <Input readOnly value={demoCredentials.webhook_url} />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(demoCredentials.webhook_url, 'Webhook URL')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="pt-4">
          <Button variant="destructive" onClick={handleRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 