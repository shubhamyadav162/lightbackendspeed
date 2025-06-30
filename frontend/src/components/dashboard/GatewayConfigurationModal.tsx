import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, TestTube, Link, Shield, Key, Globe } from 'lucide-react';
import { apiService } from '@/services/api';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  api_secret?: string;
  webhook_secret?: string;
  client_id?: string;
  api_id?: string;
  api_endpoint_url?: string;
  webhook_url?: string;
  environment?: string;
  channel_id?: string;
  auth_header?: string;
  additional_headers?: string;
  priority: number;
  monthly_limit?: number;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'maintenance';
  successRate?: number;
  dailyLimit?: number;
  currentUsage?: number;
  responseTime?: number;
  fees?: number;
  region?: string;
}

interface GatewayConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: Gateway | null;
  onSuccess?: () => void;
}

export const GatewayConfigurationModal: React.FC<GatewayConfigurationModalProps> = ({ 
  isOpen, 
  onClose, 
  gateway,
  onSuccess 
}) => {
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
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (gateway) {
      setFormData({
        name: gateway.name || '',
        provider: gateway.provider || '',
        api_key: gateway.api_key || '',
        api_secret: gateway.api_secret || '',
        webhook_secret: gateway.webhook_secret || '',
        client_id: gateway.client_id || '',
        api_id: gateway.api_id || '',
        api_endpoint_url: gateway.api_endpoint_url || '',
        webhook_url: gateway.webhook_url || '',
        environment: gateway.environment || 'test',
        channel_id: gateway.channel_id || '',
        auth_header: gateway.auth_header || '',
        additional_headers: gateway.additional_headers || '',
        priority: gateway.priority || 1,
        monthly_limit: gateway.monthly_limit || 1000000,
        is_active: gateway.is_active !== undefined ? gateway.is_active : true
      });
    }
  }, [gateway]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gateway) return;

    setIsSaving(true);
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

      await apiService.updateGateway(gateway.id, payload);
      toast.success('Gateway updated successfully');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Gateway update error:', error);
      toast.error('Failed to update gateway');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!gateway) return;
    
    setIsTesting(true);
    try {
      const response = await apiService.testGateway(gateway.id);
      if (response.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error('Connection test failed: ' + response.message);
      }
    } catch (error) {
      toast.error('Connection test error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!gateway) return null;

  const isCustomProvider = formData.provider === 'custom';
  const showEnvironment = ['phonepe', 'cashfree'].includes(formData.provider);
  const showChannelId = formData.provider === 'paytm';
  const showAuthHeader = formData.provider === 'payu';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Gateway Configuration - {gateway.name}</span>
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
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="payu">PayU</SelectItem>
                    <SelectItem value="phonepe">PhonePe</SelectItem>
                    <SelectItem value="paytm">Paytm</SelectItem>
                    <SelectItem value="cashfree">Cashfree</SelectItem>
                    <SelectItem value="easebuzz">Easebuzz</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomProvider && (
                  <p className="text-xs text-blue-600">
                    ✨ Custom provider selected - configure your specific API format
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
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    placeholder="e.g., 682aefe4e352d264171612c0"
                    value={formData.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_id">API ID</Label>
                  <Input
                    id="api_id"
                    placeholder="e.g., FRQT0XKLHY"
                    value={formData.api_id}
                    onChange={(e) => handleInputChange('api_id', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    placeholder="Enter new API secret (leave empty to keep unchanged)"
                    value={formData.api_secret}
                    onChange={(e) => handleInputChange('api_secret', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_endpoint_url">API Endpoint URL</Label>
                  <Input
                    id="api_endpoint_url"
                    type="url"
                    placeholder="https://api.your-provider.com/v1/payments"
                    value={formData.api_endpoint_url}
                    onChange={(e) => handleInputChange('api_endpoint_url', e.target.value)}
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
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="e.g., rzp_test_... or rzp_live_..."
                    value={formData.api_key}
                    onChange={(e) => handleInputChange('api_key', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    placeholder="Enter new API secret (leave empty to keep unchanged)"
                    value={formData.api_secret}
                    onChange={(e) => handleInputChange('api_secret', e.target.value)}
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
                  placeholder="Enter new webhook secret (leave empty to keep unchanged)"
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

          {/* Test Connection Section */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
