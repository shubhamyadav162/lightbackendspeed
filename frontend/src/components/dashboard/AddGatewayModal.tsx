import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useCreateGateway } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddGatewayModal: React.FC<AddGatewayModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    api_key: '',
    api_secret: '',
    client_id: '',
    api_id: '',
    api_endpoint_url: '',
    priority: 1,
    monthly_limit: 1000000,
    is_active: true
  });

  const createGateway = useCreateGateway();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        provider: formData.provider,
        priority: formData.priority,
        monthly_limit: formData.monthly_limit,
        is_active: formData.is_active,
        ...(formData.provider === 'custom' ? {
          client_id: formData.client_id,
          api_id: formData.api_id,
          api_secret: formData.api_secret,
          api_endpoint_url: formData.api_endpoint_url,
        } : {
          api_key: formData.api_key,
          api_secret: formData.api_secret,
        })
      };

      await createGateway.mutateAsync(payload);
      toast.success('Gateway सफलतापूर्वक जोड़ा गया');
      onClose();
      setFormData({
        name: '',
        provider: '',
        api_key: '',
        api_secret: '',
        client_id: '',
        api_id: '',
        api_endpoint_url: '',
        priority: 1,
        monthly_limit: 1000000,
        is_active: true
      });
      onSuccess?.();
    } catch (error) {
      toast.error('Gateway जोड़ने में विफल');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCustomProvider = formData.provider === 'custom';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>नया Payment Gateway जोड़ें</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Gateway Name</Label>
            <Input
              id="name"
              placeholder="उदाहरण: NextGen Techno Ventures"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => handleInputChange('provider', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Provider चुनें" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="payu">PayU</SelectItem>
                <SelectItem value="phonepe">PhonePe</SelectItem>
                <SelectItem value="paytm">Paytm</SelectItem>
                <SelectItem value="custom">Custom Provider</SelectItem>
              </SelectContent>
            </Select>
            {isCustomProvider && (
              <p className="text-xs text-blue-600">
                ✨ Custom provider selected - आप अपने specific credentials format का use कर सकते हैं
              </p>
            )}
          </div>

          {isCustomProvider ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  placeholder="उदाहरण: 682aefe4e352d264171612c0"
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_id">API ID</Label>
                <Input
                  id="api_id"
                  placeholder="उदाहरण: FRQT0XKLHY"
                  value={formData.api_id}
                  onChange={(e) => handleInputChange('api_id', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="उदाहरण: S84LOJ3U0N"
                  value={formData.api_secret}
                  onChange={(e) => handleInputChange('api_secret', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_endpoint_url">API Endpoint URL</Label>
                <Input
                  id="api_endpoint_url"
                  type="url"
                  placeholder="उदाहरण: https://api.nextgen-techno.com/v1/payments"
                  value={formData.api_endpoint_url}
                  onChange={(e) => handleInputChange('api_endpoint_url', e.target.value)}
                  required
                />
                <p className="text-xs text-blue-600">
                  🌐 Payment initiation के लिए actual API endpoint URL दर्ज करें
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="उदाहरण: rzp_test_... या rzp_live_..."
                  value={formData.api_key}
                  onChange={(e) => handleInputChange('api_key', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="आपकी API secret दर्ज करें"
                  value={formData.api_secret}
                  onChange={(e) => handleInputChange('api_secret', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority: {formData.priority}</Label>
            <Slider
              id="priority"
              min={1}
              max={10}
              step={1}
              value={[formData.priority]}
              onValueChange={(value) => handleInputChange('priority', value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              कम संख्या = उच्च प्राथमिकता
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_limit">Monthly Limit (₹)</Label>
            <Input
              id="monthly_limit"
              type="number"
              placeholder="1000000"
              value={formData.monthly_limit}
              onChange={(e) => handleInputChange('monthly_limit', parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Gateway Active करें</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              रद्द करें
            </Button>
            <Button type="submit" disabled={createGateway.isPending}>
              {createGateway.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gateway जोड़ें
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 