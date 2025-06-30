import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useCreateGateway } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Loader2, Link, Shield, Key, Globe } from 'lucide-react';

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
    webhook_secret: '',
    client_id: '',
    api_id: '',
    api_endpoint_url: '',
    webhook_url: '',
    environment: 'test',
    channel_id: '',
    auth_header: '',
    additional_headers: '',
    priority: 1,
    monthly_limit: 1000000,
    is_active: true
  });

  const createGateway = useCreateGateway();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 🚀 AUTO-CONFIGURATION for supported providers
      const autoConfigProviders = ['easebuzz', 'razorpay', 'payu'];
      
      if (autoConfigProviders.includes(formData.provider)) {
        // Use auto-configuration endpoint
        const response = await fetch('/api/v1/admin/gateways/auto-configure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'admin_test_key'
          },
          body: JSON.stringify({
            provider: formData.provider,
            credentials: {
              api_key: formData.api_key,
              api_secret: formData.api_secret,
              webhook_secret: formData.webhook_secret
            }
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Show simple success message with webhook URL
          toast.success(`✅ ${formData.provider} Gateway Auto-Configured!`);
          alert(`🎉 Gateway Successfully Added!\n\n🔧 अब सिर्फ ${formData.provider} dashboard में जाकर यह URL add करें:\n\n${result.webhook_url}\n\n✨ बस! बाकी सब automatic है। No coding required!`);
          
          // Reset form and close
          setFormData({
            name: '',
            provider: '',
            api_key: '',
            api_secret: '',
            webhook_secret: '',
            client_id: '',
            api_id: '',
            api_endpoint_url: '',
            webhook_url: '',
            environment: 'test',
            channel_id: '',
            auth_header: '',
            additional_headers: '',
            priority: 1,
            monthly_limit: 1000000,
            is_active: true
          });
          
          onClose();
          onSuccess?.();
          return;
        }
      }

      // Manual configuration for custom/unsupported providers
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
          webhook_url: formData.webhook_url,
          webhook_secret: formData.webhook_secret,
          additional_headers: formData.additional_headers,
        } : {
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          webhook_secret: formData.webhook_secret,
          webhook_url: formData.webhook_url,
          ...(formData.provider === 'phonepe' && { environment: formData.environment }),
          ...(formData.provider === 'cashfree' && { environment: formData.environment }),
          ...(formData.provider === 'paytm' && { channel_id: formData.channel_id }),
          ...(formData.provider === 'payu' && { auth_header: formData.auth_header }),
        })
      };

      await createGateway.mutateAsync(payload);
      toast.success('Gateway added successfully');
      onClose();
      setFormData({
        name: '',
        provider: '',
        api_key: '',
        api_secret: '',
        webhook_secret: '',
        client_id: '',
        api_id: '',
        api_endpoint_url: '',
        webhook_url: '',
        environment: 'test',
        channel_id: '',
        auth_header: '',
        additional_headers: '',
        priority: 1,
        monthly_limit: 1000000,
        is_active: true
      });
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to add gateway');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCustomProvider = formData.provider === 'custom';
  const showEnvironment = ['phonepe', 'cashfree'].includes(formData.provider);
  const showChannelId = formData.provider === 'paytm';
  const showAuthHeader = formData.provider === 'payu';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Add New Payment Gateway</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Gateway Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Gateway Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Razorpay Production"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => handleInputChange('provider', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">🚀 Razorpay (Auto-Setup)</SelectItem>
                    <SelectItem value="payu">🚀 PayU (Auto-Setup)</SelectItem>
                    <SelectItem value="easebuzz">🚀 Easebuzz (Auto-Setup)</SelectItem>
                    <SelectItem value="phonepe">PhonePe</SelectItem>
                    <SelectItem value="paytm">Paytm</SelectItem>
                    <SelectItem value="cashfree">Cashfree</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomProvider && (
                  <p className="text-xs text-blue-600">
                    ✨ Custom provider selected - configure your specific API format
                  </p>
                )}
                {['easebuzz', 'razorpay', 'payu'].includes(formData.provider) && (
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    🚀 Auto-Setup Enabled! सिर्फ credentials डालें, बाकी सब automatic होगा।
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Authentication Credentials</span>
            </h3>

            {isCustomProvider ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID *</Label>
                  <Input
                    id="client_id"
                    placeholder="e.g., 682aefe4e352d264171612c0"
                    value={formData.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_id">API ID *</Label>
                  <Input
                    id="api_id"
                    placeholder="e.g., FRQT0XKLHY"
                    value={formData.api_id}
                    onChange={(e) => handleInputChange('api_id', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret *</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    placeholder="Enter your API secret"
                    value={formData.api_secret}
                    onChange={(e) => handleInputChange('api_secret', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_endpoint_url">API Endpoint URL *</Label>
                  <Input
                    id="api_endpoint_url"
                    type="url"
                    placeholder="https://api.your-provider.com/v1/payments"
                    value={formData.api_endpoint_url}
                    onChange={(e) => handleInputChange('api_endpoint_url', e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="additional_headers">Additional Headers (JSON)</Label>
                  <Textarea
                    id="additional_headers"
                    placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
                    value={formData.additional_headers}
                    onChange={(e) => handleInputChange('additional_headers', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    JSON format for additional HTTP headers required by your gateway
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key *</Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="e.g., rzp_test_... or rzp_live_..."
                    value={formData.api_key}
                    onChange={(e) => handleInputChange('api_key', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret *</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    placeholder="Enter your API secret"
                    value={formData.api_secret}
                    onChange={(e) => handleInputChange('api_secret', e.target.value)}
                    required
                  />
                </div>

                {showEnvironment && (
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => handleInputChange('environment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test/Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showChannelId && (
                  <div className="space-y-2">
                    <Label htmlFor="channel_id">Channel ID</Label>
                    <Input
                      id="channel_id"
                      placeholder="WEB"
                      value={formData.channel_id}
                      onChange={(e) => handleInputChange('channel_id', e.target.value)}
                    />
                  </div>
                )}

                {showAuthHeader && (
                  <div className="space-y-2">
                    <Label htmlFor="auth_header">Auth Header</Label>
                    <Input
                      id="auth_header"
                      placeholder="Bearer token or auth string"
                      value={formData.auth_header}
                      onChange={(e) => handleInputChange('auth_header', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Link className="w-4 h-4 text-green-600" />
              <span>Webhook Configuration</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  placeholder="https://your-domain.com/webhook/payment-notifications"
                  value={formData.webhook_url}
                  onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  URL where payment gateway will send transaction updates
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Webhook Secret</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  placeholder="Webhook signature verification secret"
                  value={formData.webhook_secret}
                  onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Secret key for verifying webhook authenticity (optional but recommended)
                </p>
              </div>
            </div>
          </div>

          {/* Gateway Settings */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Gateway Settings</h3>

            <div className="grid grid-cols-2 gap-4">
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
                  Lower number = Higher priority (1 = Highest, 10 = Lowest)
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
                <p className="text-xs text-muted-foreground">
                  Maximum monthly transaction volume in rupees
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active">Activate Gateway</Label>
                <p className="text-xs text-gray-500">Enable this gateway for processing payments</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGateway.isPending}>
              {createGateway.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Gateway
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 