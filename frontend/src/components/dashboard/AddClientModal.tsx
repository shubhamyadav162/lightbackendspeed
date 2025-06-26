import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { Copy, Loader2, Check } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface NewClientCredentials {
  client_key: string;
  client_salt: string;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    webhook_url: '',
    fee_percentage: 2.5,
    suspend_threshold: 10000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<NewClientCredentials | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const response = await apiService.createClient(formData);
      if (response.client_key && response.client_salt) {
        setNewCredentials({
          client_key: response.client_key,
          client_salt: response.client_salt
        });
        toast.success('Client सफलतापूर्वक जोड़ा गया');
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Client जोड़ने में विफल');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleClose = () => {
    setFormData({
      company_name: '',
      contact_email: '',
      contact_phone: '',
      webhook_url: '',
      fee_percentage: 2.5,
      suspend_threshold: 10000
    });
    setNewCredentials(null);
    onClose();
  };

  if (newCredentials) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Client Credentials Generated</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ Important: इन credentials को तुरंत copy करें। ये दोबारा नहीं दिखाए जाएंगे।
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Client Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newCredentials.client_key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newCredentials.client_key, 'Client Key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Client Salt</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newCredentials.client_salt}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newCredentials.client_salt, 'Client Salt')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Client को ये credentials और webhook URL share करें:
              </p>
              <p className="text-sm font-mono mt-1">{formData.webhook_url}</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>नया Client जोड़ें</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name*</Label>
            <Input
              id="company_name"
              placeholder="ABC Enterprises Pvt Ltd"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email*</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="contact@company.com"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone*</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL*</Label>
            <Input
              id="webhook_url"
              type="url"
              placeholder="https://api.company.com/webhook/payments"
              value={formData.webhook_url}
              onChange={(e) => handleInputChange('webhook_url', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Transaction status updates के लिए webhook endpoint
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee_percentage">Fee Percentage (%)*</Label>
              <Input
                id="fee_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="2.5"
                value={formData.fee_percentage}
                onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspend_threshold">Suspend Threshold (₹)*</Label>
              <Input
                id="suspend_threshold"
                type="number"
                min="0"
                placeholder="10000"
                value={formData.suspend_threshold}
                onChange={(e) => handleInputChange('suspend_threshold', parseInt(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Service suspend होने की limit
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              रद्द करें
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Client जोड़ें
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
