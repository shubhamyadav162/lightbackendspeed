import React, { useState } from 'react';
import { Button } from '../button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '../card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Badge } from '../badge';
import { toast } from 'sonner';
import { WebhookForm } from './webhook-form';
import { merchantService } from '@/lib/api/merchant-service';
import { AlertTriangle, CheckCircle, Copy, Edit, MoreVertical, Trash } from 'lucide-react';

interface Webhook {
  id: string;
  url: string;
  secret: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookListProps {
  merchantId: string;
  webhooks: Webhook[];
  onRefresh: () => void;
}

export function WebhookList({ merchantId, webhooks, onRefresh }: WebhookListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  // Format event types for display
  const formatEventTypes = (eventTypes: string[]) => {
    return eventTypes.map(type => {
      const parts = type.split('.');
      return parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    });
  };

  // Copy webhook secret to clipboard
  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsDeleteDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsEditDialogOpen(true);
  };

  // Delete webhook
  const deleteWebhook = async () => {
    if (!selectedWebhook) return;
    
    try {
      await merchantService.deleteWebhook(merchantId, selectedWebhook.id);
      toast.success('Webhook deleted successfully');
      setIsDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  return (
    <div className="space-y-4">
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">No webhooks configured</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg truncate" title={webhook.url}>
                    {webhook.url}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    {webhook.is_active ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copySecret(webhook.secret)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Secret
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(webhook)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div className="font-semibold text-sm mb-1">Event Types:</div>
                <div className="flex flex-wrap gap-1">
                  {formatEventTypes(webhook.event_types).map((type, index) => (
                    <Badge key={index} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 text-xs text-muted-foreground">
              Created on {new Date(webhook.created_at).toLocaleDateString()}
            </CardFooter>
          </Card>
        ))
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteWebhook}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update the webhook configuration.
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <WebhookForm
              merchantId={merchantId}
              webhook={selectedWebhook}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 