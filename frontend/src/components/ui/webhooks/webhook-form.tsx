import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Checkbox } from '../checkbox';
import { toast } from 'sonner';
import { merchantService } from '@/lib/api/merchant-service';

// Define the webhook event types
const EVENT_TYPES = [
  { id: 'transaction.created', label: 'Transaction Created' },
  { id: 'transaction.updated', label: 'Transaction Updated' },
  { id: 'transaction.completed', label: 'Transaction Completed' },
  { id: 'transaction.failed', label: 'Transaction Failed' },
  { id: 'settlement.created', label: 'Settlement Created' },
  { id: 'settlement.completed', label: 'Settlement Completed' },
];

// Zod schema for form validation
const webhookSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  eventTypes: z.array(z.string()).min(1, { message: 'Select at least one event type' }),
  isActive: z.boolean().default(true),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

interface WebhookFormProps {
  merchantId: string;
  webhook?: {
    id: string;
    url: string;
    event_types: string[];
    is_active: boolean;
  };
  onSuccess: () => void;
}

export function WebhookForm({ merchantId, webhook, onSuccess }: WebhookFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!webhook;

  // Set default values from existing webhook or empty
  const defaultValues: WebhookFormValues = {
    url: webhook?.url || '',
    eventTypes: webhook?.event_types || [],
    isActive: webhook?.is_active ?? true,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues,
  });

  // Get the current values of eventTypes for controlled checkboxes
  const selectedEventTypes = watch('eventTypes');

  // Handle event type checkbox change
  const handleEventTypeChange = (eventId: string, checked: boolean) => {
    const currentEventTypes = [...selectedEventTypes];
    
    if (checked && !currentEventTypes.includes(eventId)) {
      currentEventTypes.push(eventId);
    } else if (!checked && currentEventTypes.includes(eventId)) {
      const index = currentEventTypes.indexOf(eventId);
      currentEventTypes.splice(index, 1);
    }
    
    setValue('eventTypes', currentEventTypes, { shouldValidate: true });
  };

  const onSubmit = async (data: WebhookFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && webhook) {
        // Update existing webhook
        await merchantService.updateWebhook(merchantId, webhook.id, {
          url: data.url,
          eventTypes: data.eventTypes,
          isActive: data.isActive,
        });
        toast.success('Webhook updated successfully');
      } else {
        // Create new webhook
        await merchantService.createWebhook(merchantId, {
          url: data.url,
          eventTypes: data.eventTypes,
          isActive: data.isActive,
        });
        toast.success('Webhook created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url">Webhook URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://your-server.com/webhook"
          {...register('url')}
        />
        {errors.url && (
          <p className="text-sm text-red-500">{errors.url.message}</p>
        )}
      </div>
      
      <div className="space-y-3">
        <Label>Event Types</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EVENT_TYPES.map((eventType) => (
            <div key={eventType.id} className="flex items-center space-x-2">
              <Checkbox
                id={`event-${eventType.id}`}
                checked={selectedEventTypes.includes(eventType.id)}
                onCheckedChange={(checked) => 
                  handleEventTypeChange(eventType.id, checked as boolean)
                }
              />
              <Label htmlFor={`event-${eventType.id}`} className="font-normal">
                {eventType.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.eventTypes && (
          <p className="text-sm text-red-500">{errors.eventTypes.message}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
        />
        <Label htmlFor="isActive" className="font-normal">
          Webhook Active
        </Label>
      </div>
      
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : isEditing
            ? 'Update Webhook'
            : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
}