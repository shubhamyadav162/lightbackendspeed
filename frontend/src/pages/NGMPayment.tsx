import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NGMPayment() {
  const [amount, setAmount] = useState('10');
  const [customerEmail, setCustomerEmail] = useState('test@example.com');
  const [customerName, setCustomerName] = useState('Test User');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/ngm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          amount: parseFloat(amount),
          orderId: `NGM_${Date.now()}`,
          customerEmail,
          customerName,
          returnUrl: 'https://web-production-0b337.up.railway.app/success',
          webhookUrl: 'https://web-production-0b337.up.railway.app/api/v1/ngm'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Payment initiated successfully! Redirecting to gateway...');
        // Redirect to payment gateway
        if (data.data.paymentUrl) {
          window.location.href = data.data.paymentUrl;
        }
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>NGM Payment Gateway</CardTitle>
          <CardDescription>
            Test NGM → EaseBuzz payment flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Customer Email</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          
          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
          
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
        <h2 className="text-lg font-semibold mb-4">Payment Flow:</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm">
            Website → NGM System → EaseBuzz → Bank
          </p>
        </div>
      </div>
    </div>
  );
} 