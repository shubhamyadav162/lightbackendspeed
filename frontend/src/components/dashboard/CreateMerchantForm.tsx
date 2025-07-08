import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

export function CreateMerchantForm({ closeDialog }: { closeDialog: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [easebuzzKey, setEasebuzzKey] = useState('');
  const [easebuzzSalt, setEasebuzzSalt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    merchantId: string;
    clientKey: string;
    clientSalt: string;
    webhookUrl: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedCredentials(null);

    if (!companyName || !easebuzzKey || !easebuzzSalt) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://trmqbpnnboyoneyfleux.supabase.co/functions/v1/create-merchant-gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Supabase Edge Functions often require an Authorization header with the anon key
          // This key should be stored in environment variables
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          companyName,
          easebuzzKey,
          easebuzzSalt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const result = await response.json();
      
      setGeneratedCredentials(result);
      toast({
        title: "Merchant Created Successfully!",
        description: "Share the generated credentials with the client.",
      });

    } catch (error) {
      console.error("Failed to create merchant", error);
      toast({
        variant: "destructive",
        title: "Error Creating Merchant",
        description: error.message || "An unexpected error occurred. Please check the logs.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `Copied ${fieldName}!`,
      description: `${fieldName} has been copied to your clipboard.`,
    });
  };

  if (generatedCredentials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merchant Credentials Generated</CardTitle>
          <CardDescription>
            Securely share these credentials with the merchant. This information will not be shown again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <div className="flex items-center gap-2">
                <Input id="merchantId" value={generatedCredentials.merchantId} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.merchantId, 'Merchant ID')}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientKey">Client Key</Label>
              <div className="flex items-center gap-2">
                <Input id="clientKey" value={generatedCredentials.clientKey} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.clientKey, 'Client Key')}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientSalt">Client Salt</Label>
              <div className="flex items-center gap-2">
                <Input id="clientSalt" value={generatedCredentials.clientSalt} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.clientSalt, 'Client Salt')}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
               <div className="flex items-center gap-2">
                <Input id="webhookUrl" value={generatedCredentials.webhookUrl} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.webhookUrl, 'Webhook URL')}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={closeDialog} className="w-full">Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create Easebuzz Merchant</CardTitle>
          <CardDescription>
            Enter the merchant's Easebuzz production credentials to generate a new Lightspeed merchant configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Enter merchant's company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="easebuzzKey">Easebuzz Key</Label>
            <Input
              id="easebuzzKey"
              placeholder="Enter Easebuzz production key"
              value={easebuzzKey}
              onChange={(e) => setEasebuzzKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="easebuzzSalt">Easebuzz Salt</Label>
            <Input
              id="easebuzzSalt"
              placeholder="Enter Easebuzz production salt"
              value={easebuzzSalt}
              onChange={(e) => setEasebuzzSalt(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Merchant Credentials'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 