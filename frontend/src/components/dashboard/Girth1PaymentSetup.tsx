import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, CreditCard, DollarSign, ExternalLink, Loader2, Settings, Shield, Zap } from 'lucide-react';

const Girth1PaymentSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('10');
  const [customerName, setCustomerName] = useState('Test Customer');
  const [customerEmail, setCustomerEmail] = useState('test@lightspeedpay.com');
  const [customerPhone, setCustomerPhone] = useState('9999999999');
  const [lastPaymentResult, setLastPaymentResult] = useState(null);

  // 1Payment Real Money Test Function
  const create1PaymentTest = async () => {
    console.log('💰 Creating 1Payment real money test for ₹' + paymentAmount + '...');
    setIsLoading(true);
    
    try {
      // Show loading toast
      toast.info('💰 1Payment real payment link बन रहा है...', { duration: 2000 });
      
      // Generate unique order ID
      const orderId = `1PAY_REAL_${Date.now()}`;
      const amount = parseFloat(paymentAmount);
      
      console.log('📋 1Payment Details:', {
        amount,
        orderId,
        customerName,
        customerEmail,
        customerPhone
      });
      
      // Create payment request to backend
      const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/admin/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        },
        body: JSON.stringify({
          gateway_provider: 'girth1payment',
          amount: amount,
          currency: 'INR',
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          order_id: orderId,
          description: `1Payment Real Money Test - ₹${amount}`,
          return_url: 'https://lightspeedpay.in/success',
          webhook_url: 'https://web-production-0b337.up.railway.app/api/v1/webhook/girth1payment'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 1Payment creation failed. Status:', response.status, 'Error details:', errorText);
        throw new Error(`1Payment creation failed: ${response.status} - ${errorText}`);
      }
      
      const paymentData = await response.json();
      
      if (paymentData.success && paymentData.payment_url) {
        console.log('🎉 1Payment link created successfully!');
        console.log('💳 1Payment URL:', paymentData.payment_url);
        console.log('🆔 Transaction ID:', paymentData.transaction_id);
        console.log('📱 Order ID:', orderId);
        
        setLastPaymentResult({
          success: true,
          payment_url: paymentData.payment_url,
          transaction_id: paymentData.transaction_id,
          order_id: orderId,
          amount: amount
        });
        
        // Success toast with action
        toast.success('🎉 1Payment Link तैयार हो गया!', {
          description: `₹${amount} • Order: ${orderId}`,
          duration: 8000,
          action: {
            label: 'Payment खोलें',
            onClick: () => window.open(paymentData.payment_url, '_blank')
          }
        });
        
        // Show confirmation dialog
        setTimeout(() => {
          const shouldOpen = confirm(
            `✅ 1Payment link तैयार है ₹${amount} के लिए!\n\n` +
            `Transaction ID: ${paymentData.transaction_id}\n` +
            `Order ID: ${orderId}\n\n` +
            `क्या आप अभी payment page खोलना चाहते हैं?`
          );
          
          if (shouldOpen) {
            window.open(paymentData.payment_url, '_blank');
          }
        }, 500);
        
        // Copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(paymentData.payment_url);
          setTimeout(() => {
            toast.info('📋 1Payment URL clipboard में copy हो गया!', { duration: 3000 });
          }, 1000);
        }
        
      } else {
        throw new Error(paymentData.message || '1Payment creation failed');
      }
      
    } catch (error) {
      console.error('❌ Error creating 1Payment test:', error);
      toast.error(`❌ 1Payment Test Failed: ${error.message}`, { duration: 5000 });
      
      setLastPaymentResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test 1Payment API Connection
  const test1PaymentConnection = async () => {
    console.log('🔧 Testing 1Payment API connection...');
    setIsLoading(true);
    
    try {
      toast.info('🔧 1Payment API connection test कर रहे हैं...', { duration: 2000 });
      
      const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/admin/test-gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin_test_key'
        },
        body: JSON.stringify({
          gateway_provider: 'girth1payment'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ 1Payment API Connection Successful!', {
          description: 'सभी credentials सही हैं और API respond कर रहा है',
          duration: 5000
        });
      } else {
        throw new Error(result.message || 'API test failed');
      }
      
    } catch (error) {
      console.error('❌ 1Payment API test failed:', error);
      toast.error(`❌ 1Payment API Test Failed: ${error.message}`, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                1Payment Gateway Testing
              </CardTitle>
              <p className="text-purple-700 mt-1">
                Real money testing के लिए 1Payment gateway का उपयोग करें
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              <Zap className="w-3 h-3 mr-1" />
              Production Ready
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gateway Status</p>
                <p className="text-lg font-bold text-green-600">Active</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="text-lg font-bold text-blue-600">1Payment</p>
              </div>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Environment</p>
                <p className="text-lg font-bold text-purple-600">Production</p>
              </div>
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Test Amount</p>
                <p className="text-lg font-bold text-orange-600">₹{paymentAmount}</p>
              </div>
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real Money Testing Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Real Money Payment Testing
          </CardTitle>
          <p className="text-sm text-gray-600">
            नीचे दिए गए form को भरकर real money payment test करें
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
                max="50000"
                placeholder="Enter amount"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter customer email"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Customer Phone</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={create1PaymentTest}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Create Real Payment (₹{paymentAmount})
            </Button>
            
            <Button
              onClick={test1PaymentConnection}
              disabled={isLoading}
              variant="outline"
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
              Test API Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Payment Result */}
      {lastPaymentResult && (
        <Card className={lastPaymentResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`text-lg flex items-center gap-2 ${lastPaymentResult.success ? "text-green-900" : "text-red-900"}`}>
              {lastPaymentResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              Last Payment Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastPaymentResult.success ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-800">Transaction ID</p>
                    <p className="text-sm text-green-700">{lastPaymentResult.transaction_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Order ID</p>
                    <p className="text-sm text-green-700">{lastPaymentResult.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Amount</p>
                    <p className="text-sm text-green-700">₹{lastPaymentResult.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Status</p>
                    <p className="text-sm text-green-700">Payment Link Created</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => window.open(lastPaymentResult.payment_url, '_blank')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Payment Page
                  </Button>
                  <Button
                    onClick={() => navigator.clipboard.writeText(lastPaymentResult.payment_url)}
                    size="sm"
                    variant="outline"
                    className="bg-green-100 border-green-200 hover:bg-green-200"
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-red-700">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{lastPaymentResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety Guidelines */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Real Money Testing - Safety Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-amber-800">
            <p>• <strong>Start Small:</strong> हमेशा छोटी amount (₹1-₹10) से शुरू करें</p>
            <p>• <strong>Test Environment:</strong> पहले test mode में verify करें</p>
            <p>• <strong>Monitor Transactions:</strong> हर payment को track करें</p>
            <p>• <strong>Keep Records:</strong> सभी transaction IDs को save करें</p>
            <p>• <strong>Use Test Cards:</strong> Real cards का उपयोग सावधानी से करें</p>
            <p>• <strong>Check Webhooks:</strong> Payment success/failure callbacks को verify करें</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Girth1PaymentSetup; 