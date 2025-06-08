'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { WebhookList } from '@/components/ui/webhooks/webhook-list';
import { WebhookForm } from '@/components/ui/webhooks/webhook-form';
import { merchantService } from '@/lib/api/merchant-service';
import { useMerchantProfile } from '@/hooks/use-merchant-profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

interface Webhook {
  id: string;
  url: string;
  secret: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WebhooksPage() {
  const { merchant } = useMerchantProfile();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch webhooks
  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const data = await merchantService.getWebhooks();
      setWebhooks(data);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch webhooks on component mount
  useEffect(() => {
    fetchWebhooks();
  }, []);

  if (!merchant) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>Loading merchant profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Manage webhook integrations for your application
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Webhooks</CardTitle>
          <CardDescription>
            Webhooks allow you to receive real-time notifications when events occur in your LightSpeedPay account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">How webhooks work:</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When an event occurs in your account, we&apos;ll send an HTTP POST request to the URL you specify.
                The request will include information about the event that occurred.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Security:</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Each webhook has a secret key that is used to sign the webhook payload. You should verify the signature
                to ensure the webhook came from LightSpeedPay.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Webhook endpoints should:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 ml-4">
                <li>Respond with a 2xx status code when successfully received</li>
                <li>Process webhooks asynchronously (respond quickly, process later)</li>
                <li>Be prepared to receive the same event multiple times (implement idempotency)</li>
                <li>Be publicly accessible and handle HTTPS requests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <p>Loading webhooks...</p>
        </div>
      ) : (
        <WebhookList
          merchantId={merchant.id}
          webhooks={webhooks}
          onRefresh={fetchWebhooks}
        />
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Add a new webhook endpoint to receive event notifications.
            </DialogDescription>
          </DialogHeader>
          <WebhookForm
            merchantId={merchant.id}
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              fetchWebhooks();
              toast.success('Webhook created successfully');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 