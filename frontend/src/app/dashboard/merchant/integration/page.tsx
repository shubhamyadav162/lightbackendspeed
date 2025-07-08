"use client";

import React, { useState } from 'react';
import { useIntegrationDetails } from '../../../../hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff } from 'lucide-react';

const KeyDisplayCard = ({ title, value, isSecret = false }: { title: string; value: string; isSecret?: boolean }) => {
    const [isVisible, setIsVisible] = useState(!isSecret);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        // Consider adding a toast notification for better UX
        alert(`${title} copied to clipboard!`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input
                        type={isVisible ? 'text' : 'password'}
                        value={value}
                        readOnly
                        className="font-mono"
                    />
                    {isSecret && (
                        <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)}>
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default function IntegrationCenter() {
  const { data: details, isLoading, error } = useIntegrationDetails();

  if (isLoading) return <div>Loading integration details...</div>;
  if (error) return <div>Error loading details: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Integration Center</h1>
        <p className="text-muted-foreground">
          Your API keys and webhook details for integrating with LightSpeedPay.
        </p>
      </div>

      <div className="space-y-4">
        <KeyDisplayCard title="Client Key" value={details?.client_key || ''} />
        <KeyDisplayCard title="Client Salt" value={details?.client_salt || ''} isSecret />
        <KeyDisplayCard title="Webhook URL" value={details?.webhook_url || ''} />
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
            <CardTitle>Important Security Notice</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-yellow-800">
                Keep your Client Salt secure and do not expose it on the client-side (e.g., in your website's JavaScript).
                It should only be used on your server to sign payment initiation requests.
            </p>
        </CardContent>
      </Card>
    </div>
  );
} 