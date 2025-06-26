import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Loader2, TestTube } from 'lucide-react';
import { apiService } from '@/services/api';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  api_secret?: string;
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
      await apiService.updateGateway(gateway.id, formData);
      toast.success('Gateway सफलतापूर्वक अपडेट किया गया');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Gateway update error:', error);
      toast.error('Gateway अपडेट करने में विफल');
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
        toast.success('Connection test सफल रहा!');
      } else {
        toast.error('Connection test विफल: ' + response.message);
      }
    } catch (error) {
      toast.error('Connection test में त्रुटि');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gateway Configuration - {gateway.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Gateway Name</Label>
            <Input
              id="name"
              placeholder="उदाहरण: Razorpay - Primary"
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api_key"
                type="password"
                placeholder="नई API key दर्ज करें (खाली छोड़ने पर unchanged रहेगी)"
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              placeholder="नई API secret दर्ज करें (खाली छोड़ने पर unchanged रहेगी)"
              value={formData.api_secret}
              onChange={(e) => handleInputChange('api_secret', e.target.value)}
            />
          </div>

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
              रद्द करें
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Changes सेव करें
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
