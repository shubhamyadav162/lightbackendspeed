import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, CheckCircle, AlertCircle, Zap, Settings, TestTube } from 'lucide-react';
import { toast } from 'sonner';

// ✅ FIXED: Get proper backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

// ✅ CORRECTED: Real NGME client credentials for authenticating with our own backend API
const NGME_CLIENT_KEY = 'c8691c56-5714-4f80-943a-cd4862cc91d6';
const NGME_CLIENT_SALT = 'QECGU7UHNT';

// Updated to use correct backend URLs for Railway deployment
export const EasebuzzQuickSetup = () => {
  const [isConfigured, setIsConfigured] = useState(true); // Already exists
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [credentials, setCredentials] = useState({
    // ENV variables को अनदेखा करते हुए सीधे सही रीयल क्रेडेंशियल सेट करें
    clientId: '682d9154e352d26417059640',
    merchantKey: '2a4a4437-440f-4bd4-82b4-88cdcf8a468a',
    salt: 'QECGU7UHNT',
    environment: "production"
  });

  // ✅ CORRECTED: Using proper LightSpeedPay webhook URL
  const webhookUrl = "https://api.lightspeedpay.in/api/v1/callback/easebuzz";
  const successUrl = "https://pay.lightspeedpay.com/success";
  const failureUrl = "https://pay.lightspeedpay.com/failed";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const testEasebuzzConnection = async () => {
    setIsTestingConnection(true);
    try {
      // ✅ FIXED: Use full Railway backend URL
      const response = await fetch(`${API_BASE_URL}/admin/gateways/2fc79b96-36a3-4a67-ab21-94ce961600b8/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('🎉 NGME Easebuzz Connection Test Successful!', {
          description: 'Gateway is working perfectly with your real credentials'
        });
      } else {
        toast.error('❌ Connection Test Failed', {
          description: result.message || 'Check credentials and try again'
        });
      }
    } catch (error) {
      toast.error('❌ Test Failed', {
        description: 'Network error or server issue'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const updateGatewayCredentials = async () => {
    try {
      // ✅ FIXED: Use full Railway backend URL
      const response = await fetch(`${API_BASE_URL}/admin/gateways/2fc79b96-36a3-4a67-ab21-94ce961600b8`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        },
        body: JSON.stringify({
          name: "🚀 NGME's bus, payment gateway",
          provider: "easebuzz",
          credentials: {
            api_key: credentials.merchantKey,
            api_secret: credentials.salt,
            client_id: credentials.clientId,
            environment: credentials.environment,
            webhook_url: webhookUrl
          },
          environment: credentials.environment,
          priority: 1,
          is_active: true
        })
      });

      if (response.ok) {
        toast.success('✅ Gateway Updated with Real NGME Credentials!');
        setIsConfigured(true);
      } else {
        const errorData = await response.text();
        console.error('Update error:', errorData);
        toast.error('❌ Update Failed', {
          description: `Server error: ${response.status}`
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('❌ Network Error', {
        description: 'Could not connect to server'
      });
    }
  };

  // Real Money Payment Test Function
  const createRealPaymentTest = async () => {
    console.log('💰 Creating real money payment test for ₹10...');
    
    try {
      // Show loading toast
      toast.info('💰 Creating real payment link...', { duration: 2000 });
      
      // Generate unique order ID
      const orderId = `NGME_TEST_${Date.now()}`;
      const customerEmail = 'ngme@lightspeedpay.com';
      const customerPhone = '9999999999';
      const customerName = 'NGME Real Test User';
      const amount = 10;
      
      console.log('📋 NGME Payment Details:', {
        amount,
        orderId,
        customerName,
        customerEmail,
        customerPhone
      });
      
      // ✅ FIXED: Use correct NGME Edge Function instead of Railway backend
      console.log('🔐 Using NGME Edge Function for payment initiation...');

      // ✅ CORRECTED: Use the correct credentials from the component's state
      const realClientKey = credentials.merchantKey; 
      const realClientSalt = credentials.salt;

      console.log('✅ Using NGME client credentials from state:', { realClientKey, realClientSalt });

      // ✅ FIXED: Use Edge Function URL instead of Railway backend
      const edgeFunctionUrl = 'https://trmqbpnnboyoneyfleux.supabase.co/functions/v1/easebuzz-payment';

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk'}`
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paisa as expected by function
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          order_id: orderId,
          description: `NGME Real Money Test - ₹${amount} via Easebuzz`,
          test_mode: false, // Set to false for real money
          client_key: realClientKey, // ✅ FIXED: Pass correct client key from state
          client_salt: realClientSalt // ✅ FIXED: Pass correct client salt from state
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NGME Edge Function failed. Status:', response.status, 'Error details:', errorText);
        throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
      }
      
      const paymentData = await response.json();
      
      if (paymentData.success && paymentData.checkout_url) {
        console.log('🎉 NGME Payment link created successfully!');
        console.log('💳 Payment URL:', paymentData.checkout_url);
        console.log('🆔 Transaction ID:', paymentData.transaction_id);
        console.log('📱 Order ID:', orderId);
        
        // Success toast with action
        toast.success('🎉 NGME Real Payment Link Created!', {
          description: `₹${amount} • Order: ${orderId} • Via NGME Easebuzz Edge Function`,
          duration: 8000,
          action: {
            label: 'Open Payment',
            onClick: () => window.open(paymentData.checkout_url, '_blank')
          }
        });
        
        // Also open payment page automatically
        setTimeout(() => {
          const shouldOpen = confirm(
            `✅ NGME real payment link created for ₹${amount}!\n\n` +
            `Transaction ID: ${paymentData.transaction_id}\n` +
            `Order ID: ${orderId}\n\n` +
            `⚠️ यह REAL MONEY payment है!\n` +
            `क्या आप payment page खोलना चाहते हैं?\n\n` +
            `Payment URL automatically clipboard में copy हो जाएगा।`
          );
          
          if (shouldOpen) {
            window.open(paymentData.checkout_url, '_blank');
          }
        }, 500);
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(paymentData.checkout_url);
          setTimeout(() => {
            toast.info('📋 Payment URL copied to clipboard!', { duration: 3000 });
          }, 1000);
        }
        
        return {
          success: true,
          payment_url: paymentData.checkout_url,
          transaction_id: paymentData.transaction_id,
          order_id: orderId,
          amount: amount
        };
        
      } else {
        throw new Error(paymentData.message || 'Payment creation failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating NGME payment test:', error);
      toast.error(`❌ NGME Payment Test Failed: ${error.message}`, { duration: 5000 });
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">NGME's bus, payment gateway</CardTitle>
              <p className="text-sm text-gray-600">Complete gateway management with your REAL credentials</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isConfigured ? "default" : "secondary"} className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {isConfigured ? "Real Credentials" : "Setup Required"}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Production Ready
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Credentials Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              ✅ Real NGME Easebuzz Credentials
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="clientId" className="text-sm font-medium">Client ID ✅ CORRECTED</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="clientId"
                    value={credentials.clientId}
                    onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.clientId, "Client ID")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-1">NGME's bus Client ID</p>
              </div>

              <div>
                <Label htmlFor="merchantKey" className="text-sm font-medium">Merchant Key ✅ CORRECTED</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="merchantKey"
                    value={credentials.merchantKey}
                    onChange={(e) => setCredentials({...credentials, merchantKey: e.target.value})}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.merchantKey, "Merchant Key")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-1">Real NGME API Key</p>
              </div>
              
              <div>
                <Label htmlFor="salt" className="text-sm font-medium">Salt ✅ CORRECTED</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="salt"
                    value={credentials.salt}
                    onChange={(e) => setCredentials({...credentials, salt: e.target.value})}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.salt, "Salt")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-1">Real NGME API Secret</p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="environment" className="text-sm font-medium">Environment</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Test</span>
                  <Switch
                    id="environment"
                    checked={credentials.environment === "production"}
                    onCheckedChange={(checked) => 
                      setCredentials({...credentials, environment: checked ? "production" : "test"})
                    }
                  />
                  <span className="text-xs text-gray-900 font-medium">Production</span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook URLs Section */}
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Easebuzz Dashboard Setup
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Webhook URL ✅ CORRECTED</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  ✅ This is the CORRECT webhook URL for Easebuzz dashboard
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Success URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={successUrl}
                    readOnly
                    className="font-mono text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(successUrl, "Success URL")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Failure URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={failureUrl}
                    readOnly
                    className="font-mono text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(failureUrl, "Failure URL")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p>✅ Gateway ID: 2fc79b96-36a3-4a67-ab21-94ce961600b8</p>
            <p>✅ Status: Active | Priority: 1 | Environment: {credentials.environment}</p>
            <p>✅ Credentials: Real NGME's bus</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={testEasebuzzConnection}
              disabled={isTestingConnection}
              className="bg-orange-50 border-orange-200 hover:bg-orange-100"
            >
              {isTestingConnection ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test Real Credentials
            </Button>
            
            <Button
              onClick={createRealPaymentTest}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              💰 Real Money Test (₹10)
            </Button>
            
            <Button
              onClick={updateGatewayCredentials}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update with Real Credentials
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Next Steps with Real Credentials:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Login to your Easebuzz Dashboard: <strong>https://dashboard.easebuzz.in/</strong></li>
            <li>Navigate to <strong>Settings → Webhook Configuration</strong></li>
            <li>Add the CORRECTED Webhook URL: <strong className="bg-green-100 px-1 rounded">https://api.lightspeedpay.in/api/v1/callback/easebuzz</strong></li>
            <li>Use your REAL credentials: Client ID <strong className="bg-blue-100 px-1 rounded">682d9154e352d26417059640</strong></li>
            <li>Save settings and test the connection using the button above</li>
          </ol>
        </div>

        {/* Real Credentials Summary */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ Your Real NGME Tech Growth Credentials:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Client ID:</strong> <code className="bg-white px-1 rounded">682d9154e352d26417059640</code></p>
            <p><strong>Merchant Key:</strong> <code className="bg-white px-1 rounded">2a4a4437-440f-4bd4-82b4-88cdcf8a468a</code></p>
            <p><strong>Salt:</strong> <code className="bg-white px-1 rounded">QECGU7UHNT</code></p>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">Real</div>
            <div className="text-xs text-green-700">NextGen Credentials</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Priority 1</div>
            <div className="text-xs text-blue-700">Highest Priority</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">Live</div>
            <div className="text-xs text-purple-700">Production Ready</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 