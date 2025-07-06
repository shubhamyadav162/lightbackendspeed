import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, CreditCard, AlertCircle, Loader2 } from 'lucide-react';

const NgmePaymentTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '100', // 1 rupee for testing
    customerName: 'Test Customer',
    customerEmail: 'test@ngme.com',
    customerPhone: '9999999999',
    description: 'NGME Test Payment - NextGen Techno Growth'
  });

  const SUPABASE_FUNCTIONS_URL = 'https://trmqbpnnboyoneyfleux.supabase.co/functions/v1';

  const checkCredentials = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/ngme-credentials-setup`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(`✅ NGME Credentials Loaded Successfully!
        
Provider: ${data.provider}
Environment: ${data.environment}
Client ID: ${data.client_id}
Merchant Key: ${data.merchant_key}
Salt: ${data.salt}

URLs:
- Webhook: ${data.urls.webhook}
- Success: ${data.urls.success}
- Failure: ${data.urls.failure}`);
        setCredentialsLoaded(true);
      } else {
        setStatus('error');
        setMessage('❌ Failed to load credentials');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPayment = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/easebuzz-payment-ngme/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(paymentData.amount),
          customer_email: paymentData.customerEmail,
          customer_name: paymentData.customerName,
          customer_phone: paymentData.customerPhone,
          description: paymentData.description
        }),
      });

      if (response.ok) {
        const html = await response.text();
        
        // Create a new window to show the payment form
        const paymentWindow = window.open('', '_blank', 'width=800,height=600');
        if (paymentWindow) {
          paymentWindow.document.write(html);
          paymentWindow.document.close();
          
          setStatus('success');
          setMessage('✅ Payment form opened in new window. Complete the payment process there.');
        } else {
          setStatus('error');
          setMessage('❌ Failed to open payment window. Please allow popups.');
        }
      } else {
        const errorData = await response.json();
        setStatus('error');
        setMessage(`❌ Payment Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            NGME Easebuzz Payment Test
          </CardTitle>
          <CardDescription>
            Test your real NextGen Techno Growth Easebuzz credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credentials Status */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Step 1: Check Credentials</Label>
            <Button
              onClick={checkCredentials}
              disabled={loading}
              className="w-full"
              variant={credentialsLoaded ? "default" : "outline"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : credentialsLoaded ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Credentials Loaded
                </>
              ) : (
                'Check NGME Credentials'
              )}
            </Button>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Step 2: Test Payment</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (in paise)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  placeholder="100"
                />
                <p className="text-sm text-gray-500 mt-1">100 paise = ₹1</p>
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={paymentData.customerName}
                  onChange={(e) => setPaymentData({...paymentData, customerName: e.target.value})}
                  placeholder="Test Customer"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={paymentData.customerEmail}
                  onChange={(e) => setPaymentData({...paymentData, customerEmail: e.target.value})}
                  placeholder="test@ngme.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={paymentData.customerPhone}
                  onChange={(e) => setPaymentData({...paymentData, customerPhone: e.target.value})}
                  placeholder="9999999999"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={paymentData.description}
                onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                placeholder="NGME Test Payment - NextGen Techno Growth"
              />
            </div>
            <Button
              onClick={testPayment}
              disabled={loading || !credentialsLoaded}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create Test Payment
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {message && (
            <Alert className={status === 'error' ? 'border-red-500' : 'border-green-500'}>
              {status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🔧 Configuration Info</h4>
            <div className="text-sm space-y-1">
              <p><strong>Provider:</strong> NextGen Techno Growth</p>
              <p><strong>Environment:</strong> Production</p>
              <p><strong>Client ID:</strong> 682d9154e352d26417059640</p>
              <p><strong>Merchant Key:</strong> FQAB*** (hidden for security)</p>
              <p><strong>Salt:</strong> QECG*** (hidden for security)</p>
            </div>
          </div>

          {/* URLs Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🔗 Webhook URLs</h4>
            <div className="text-sm space-y-1">
              <p><strong>Webhook:</strong> https://api.lightspeedpay.in/api/v1/callback/easebuzz</p>
              <p><strong>Alternative:</strong> https://trmqbpnnboyoneyfleux.supabase.co/functions/v1/ngme-webhook-handler</p>
              <p><strong>Success:</strong> https://pay.lightspeedpay.com/success</p>
              <p><strong>Failure:</strong> https://pay.lightspeedpay.com/failed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NgmePaymentTest; 