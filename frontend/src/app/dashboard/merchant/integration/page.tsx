'use client';

import { useState } from 'react';
import { useMerchantIntegration } from "@/hooks/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_API_KEY = "lightspeed_test_uZQgSAXLEpVNj8B2hfxJDc97QK6R5wTY";
const DEMO_API_SECRET = "lightspeed_secret_7mP2vHKn4WcXtDfAGeZ83gLjYSRaB9sq";

export default function MerchantIntegrationPage() {
  const { data: integration, isLoading } = useMerchantIntegration();
  const [activeTab, setActiveTab] = useState('web');
  const [copied, setCopied] = useState<string | null>(null);
  
  const API_KEY = integration?.client_key ?? DEMO_API_KEY;
  const API_SECRET = integration?.client_salt ?? DEMO_API_SECRET;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Integration Guide</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your API Credentials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">API Key (Test)</label>
            <div className="flex items-center">
              <code className="bg-gray-100 dark:bg-gray-900 p-2 rounded flex-1 font-mono text-sm">
                {isLoading ? 'loading...' : API_KEY}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => copyToClipboard(API_KEY, 'apiKey')}
              >
                {copied === 'apiKey' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">API Secret (Test)</label>
            <div className="flex items-center">
              <code className="bg-gray-100 dark:bg-gray-900 p-2 rounded flex-1 font-mono text-sm">
                {isLoading ? 'loading...' : API_SECRET}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => copyToClipboard(API_SECRET, 'apiSecret')}
              >
                {copied === 'apiSecret' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          These are your test credentials. Use them in your sandbox environment to test the integration.
          <br />
          <strong>Important:</strong> Never share your API credentials or include them in client-side code.
        </p>
      </div>
      
      <Tabs defaultValue="web" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="web">Web Integration</TabsTrigger>
          <TabsTrigger value="server">Server Integration</TabsTrigger>
          <TabsTrigger value="unity">Unity SDK</TabsTrigger>
        </TabsList>
        
        <TabsContent value="web" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Web Integration</CardTitle>
              <CardDescription>
                Add LightSpeedPay to your website with our JavaScript SDK
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Add the JavaScript SDK</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`<script src="https://cdn.lightspeedpay.com/js/v1/lightspeed.js"></script>`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('<script src="https://cdn.lightspeedpay.com/js/v1/lightspeed.js"></script>', 'sdk')}
                  >
                    {copied === 'sdk' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">2. Initialize the SDK</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize LightSpeedPay
    LightSpeedPay.init({
      merchantId: 'YOUR_MERCHANT_ID',
      publicKey: '${API_KEY}'
    });
  });
</script>`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize LightSpeedPay
    LightSpeedPay.init({
      merchantId: 'YOUR_MERCHANT_ID',
      publicKey: '${API_KEY}'
    });
  });
</script>`, 'init')}
                  >
                    {copied === 'init' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">3. Create a Payment Button</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`<button id="pay-button">Pay Now</button>

<script>
  document.getElementById('pay-button').addEventListener('click', function() {
    LightSpeedPay.createPayment({
      amount: 1000, // Amount in paise/cents
      currency: 'INR',
      description: 'Order #123',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210'
      },
      callback_url: 'https://your-website.com/order/success',
      cancel_url: 'https://your-website.com/order/cancel'
    }).then(function(result) {
      // Payment initiated, redirect to checkout page
      window.location.href = result.checkout_url;
    }).catch(function(error) {
      console.error('Payment error:', error);
    });
  });
</script>`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`<button id="pay-button">Pay Now</button>

<script>
  document.getElementById('pay-button').addEventListener('click', function() {
    LightSpeedPay.createPayment({
      amount: 1000, // Amount in paise/cents
      currency: 'INR',
      description: 'Order #123',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210'
      },
      callback_url: 'https://your-website.com/order/success',
      cancel_url: 'https://your-website.com/order/cancel'
    }).then(function(result) {
      // Payment initiated, redirect to checkout page
      window.location.href = result.checkout_url;
    }).catch(function(error) {
      console.error('Payment error:', error);
    });
  });
</script>`, 'button')}
                  >
                    {copied === 'button' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="server" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Server Integration</CardTitle>
              <CardDescription>
                Integrate LightSpeedPay into your backend using our server SDKs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Node.js</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`// Install: npm install lightspeedpay-node --save
const LightSpeedPay = require('lightspeedpay-node');

// Initialize with your API credentials
const lightspeed = new LightSpeedPay({
  apiKey: '${API_KEY}',
  apiSecret: '${API_SECRET}',
  environment: 'sandbox' // Use 'production' for live transactions
});

// Create a payment
async function createPayment() {
  try {
    const payment = await lightspeed.payments.create({
      amount: 1000, // Amount in paise/cents
      currency: 'INR',
      description: 'Order #123',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210'
      },
      callback_url: 'https://your-website.com/order/success',
      cancel_url: 'https://your-website.com/order/cancel'
    });
    
    console.log('Payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`// Install: npm install lightspeedpay-node --save
const LightSpeedPay = require('lightspeedpay-node');

// Initialize with your API credentials
const lightspeed = new LightSpeedPay({
  apiKey: '${API_KEY}',
  apiSecret: '${API_SECRET}',
  environment: 'sandbox' // Use 'production' for live transactions
});

// Create a payment
async function createPayment() {
  try {
    const payment = await lightspeed.payments.create({
      amount: 1000, // Amount in paise/cents
      currency: 'INR',
      description: 'Order #123',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210'
      },
      callback_url: 'https://your-website.com/order/success',
      cancel_url: 'https://your-website.com/order/cancel'
    });
    
    console.log('Payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}`, 'nodejs')}
                  >
                    {copied === 'nodejs' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Verify Webhook Signature</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`// Express.js webhook handler example
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Use raw body for webhook signature verification
app.use('/webhook', 
  bodyParser.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-lightspeed-signature'];
    const payload = req.body;
    
    // Verify webhook signature
    if (lightspeed.webhooks.verifySignature(payload, signature, '${API_SECRET}')) {
      const event = JSON.parse(payload.toString());
      
      // Handle webhook event
      switch (event.type) {
        case 'payment.success':
          // Handle successful payment
          console.log('Payment succeeded:', event.data);
          break;
        case 'payment.failed':
          // Handle failed payment
          console.log('Payment failed:', event.data);
          break;
        // Handle other event types...
      }
      
      res.status(200).send('Webhook received');
    } else {
      // Invalid signature
      res.status(400).send('Invalid webhook signature');
    }
  }
);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`// Express.js webhook handler example
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Use raw body for webhook signature verification
app.use('/webhook', 
  bodyParser.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-lightspeed-signature'];
    const payload = req.body;
    
    // Verify webhook signature
    if (lightspeed.webhooks.verifySignature(payload, signature, '${API_SECRET}')) {
      const event = JSON.parse(payload.toString());
      
      // Handle webhook event
      switch (event.type) {
        case 'payment.success':
          // Handle successful payment
          console.log('Payment succeeded:', event.data);
          break;
        case 'payment.failed':
          // Handle failed payment
          console.log('Payment failed:', event.data);
          break;
        // Handle other event types...
      }
      
      res.status(200).send('Webhook received');
    } else {
      // Invalid signature
      res.status(400).send('Invalid webhook signature');
    }
  }
);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});`, 'webhook')}
                  >
                    {copied === 'webhook' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unity SDK Integration</CardTitle>
              <CardDescription>
                Integrate LightSpeedPay into your Unity games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Install the Unity SDK</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Download and import the LightSpeedPay SDK package from the Unity Asset Store or use the direct package URL in the Package Manager.
                </p>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`// Package URL for Unity Package Manager
https://github.com/lightspeedpay/unity-sdk.git`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('https://github.com/lightspeedpay/unity-sdk.git', 'unity-url')}
                  >
                    {copied === 'unity-url' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">2. Initialize the SDK</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`using LightSpeedPay;
using UnityEngine;

public class PaymentManager : MonoBehaviour
{
    void Start()
    {
        // Initialize the SDK
        LightSpeedPaySDK.Initialize("${API_KEY}", LightSpeedEnvironment.Sandbox);
        
        // Register callback handlers
        LightSpeedPaySDK.OnPaymentSuccess += HandlePaymentSuccess;
        LightSpeedPaySDK.OnPaymentFailure += HandlePaymentFailure;
        LightSpeedPaySDK.OnPaymentCancelled += HandlePaymentCancelled;
    }
    
    private void HandlePaymentSuccess(PaymentResponse response)
    {
        Debug.Log("Payment successful: " + response.transactionId);
        // Grant items or update game state
    }
    
    private void HandlePaymentFailure(PaymentResponse response)
    {
        Debug.LogError("Payment failed: " + response.errorMessage);
        // Handle failure
    }
    
    private void HandlePaymentCancelled(PaymentResponse response)
    {
        Debug.Log("Payment cancelled by user");
        // Handle cancellation
    }
}`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`using LightSpeedPay;
using UnityEngine;

public class PaymentManager : MonoBehaviour
{
    void Start()
    {
        // Initialize the SDK
        LightSpeedPaySDK.Initialize("${API_KEY}", LightSpeedEnvironment.Sandbox);
        
        // Register callback handlers
        LightSpeedPaySDK.OnPaymentSuccess += HandlePaymentSuccess;
        LightSpeedPaySDK.OnPaymentFailure += HandlePaymentFailure;
        LightSpeedPaySDK.OnPaymentCancelled += HandlePaymentCancelled;
    }
    
    private void HandlePaymentSuccess(PaymentResponse response)
    {
        Debug.Log("Payment successful: " + response.transactionId);
        // Grant items or update game state
    }
    
    private void HandlePaymentFailure(PaymentResponse response)
    {
        Debug.LogError("Payment failed: " + response.errorMessage);
        // Handle failure
    }
    
    private void HandlePaymentCancelled(PaymentResponse response)
    {
        Debug.Log("Payment cancelled by user");
        // Handle cancellation
    }
}`, 'unity-init')}
                  >
                    {copied === 'unity-init' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">3. Initiate a Payment</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono">
                      {`public void MakePurchase()
{
    PaymentRequest request = new PaymentRequest
    {
        amount = 9900, // Amount in paise/cents (99.00)
        currency = "INR",
        description = "1000 Game Coins",
        customerId = "player123",
        metadata = new Dictionary<string, string>
        {
            { "playerId", "player123" },
            { "itemId", "coins_1000" }
        }
    };
    
    // Show the payment UI
    LightSpeedPaySDK.ShowPaymentUI(request);
}`}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`public void MakePurchase()
{
    PaymentRequest request = new PaymentRequest
    {
        amount = 9900, // Amount in paise/cents (99.00)
        currency = "INR",
        description = "1000 Game Coins",
        customerId = "player123",
        metadata = new Dictionary<string, string>
        {
            { "playerId", "player123" },
            { "itemId", "coins_1000" }
        }
    };
    
    // Show the payment UI
    LightSpeedPaySDK.ShowPaymentUI(request);
}`, 'unity-payment')}
                  >
                    {copied === 'unity-payment' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          If you have any questions or need assistance with your integration, please contact our support team.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline">View Full Documentation</Button>
          <Button variant="default">Contact Support</Button>
        </div>
      </div>
    </div>
  );
} 