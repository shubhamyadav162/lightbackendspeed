# LightSpeedPay SDK Integration Guides

This document provides comprehensive guides for integrating LightSpeedPay's SDKs into your applications.

## Table of Contents
- [JavaScript/TypeScript SDK](#javascripttypescript-sdk)
- [Unity (C#) SDK](#unity-c-sdk)
- [Testing Your Integration](#testing-your-integration)
- [Going Live](#going-live)

## JavaScript/TypeScript SDK

### Installation

Using npm:
```bash
npm install lightspeedpay-js
```

Using yarn:
```bash
yarn add lightspeedpay-js
```

### Basic Setup

```typescript
import { LightSpeedPay } from 'lightspeedpay-js';

// Initialize with your API key
const lightspeedpay = new LightSpeedPay({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox' // Use 'production' for live transactions
});
```

### Creating a Transaction

```typescript
// Create a transaction
const transaction = await lightspeedpay.transactions.create({
  amount: 1000.00, // Amount in INR (₹1000.00)
  currency: 'INR',
  customerEmail: 'customer@example.com',
  customerPhone: '9876543210',
  orderId: 'ORD123456', // Your internal order ID
  description: 'Payment for Order #ORD123456',
  callbackUrl: 'https://your-website.com/payment/callback',
  gatewayPreference: 'razorpay', // Optional - specify preferred gateway
  metadata: {
    productId: 'PROD123',
    customerId: 'CUST456'
  }
});

// Get checkout URL
const checkoutUrl = transaction.checkoutUrl;
// Redirect your customer to this URL for payment
window.location.href = checkoutUrl;
```

### Handling the Callback

When a customer completes or abandons a payment, they'll be redirected to your `callbackUrl` with the transaction status:

```typescript
// Example Express.js route handler
app.get('/payment/callback', async (req, res) => {
  const { transaction_id, status } = req.query;
  
  // Verify transaction status from the server (never trust client-side parameters)
  const transaction = await lightspeedpay.transactions.get(transaction_id);
  
  if (transaction.status === 'completed') {
    // Payment successful - fulfill the order
    // ...
    res.redirect('/thank-you');
  } else {
    // Payment failed or pending
    res.redirect('/payment-failed');
  }
});
```

### Implementing Webhooks

Set up a webhook endpoint to receive real-time notifications:

```typescript
// Example Express.js webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-signature'];
  
  try {
    // Verify webhook signature
    const event = lightspeedpay.webhooks.constructEvent(
      req.body,
      signature,
      'YOUR_WEBHOOK_SECRET'
    );
    
    // Handle different event types
    switch (event.type) {
      case 'transaction.completed':
        const transaction = event.data;
        // Update order status, send confirmation email, etc.
        break;
      case 'settlement.completed':
        const settlement = event.data;
        // Update your accounting records
        break;
      // Handle other event types
    }
    
    res.status(200).send({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

### Advanced Configuration

#### Custom Headers

```typescript
const lightspeedpay = new LightSpeedPay({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox',
  headers: {
    'X-Custom-Header': 'Custom-Value'
  }
});
```

#### Timeouts

```typescript
const lightspeedpay = new LightSpeedPay({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox',
  timeout: 30000 // 30 seconds
});
```

## Unity (C#) SDK

### Installation

1. Download the LightSpeedPay Unity SDK package from the [Developer Portal](https://developer.lightspeedpay.com/downloads/unity-sdk-latest.unitypackage)
2. In Unity, go to Assets > Import Package > Custom Package
3. Select the downloaded package file
4. Import all components

### Basic Setup

```csharp
using LightSpeedPay;
using LightSpeedPay.Models;

// Initialize the SDK in your game startup script
void Start()
{
    LightSpeedPaySDK.Initialize("YOUR_API_KEY", LightSpeedEnvironment.Sandbox);
}
```

### Creating a Transaction

```csharp
// Create transaction request
TransactionRequest request = new TransactionRequest
{
    Amount = 1000.00m,
    Currency = "INR",
    CustomerEmail = "player@example.com",
    CustomerPhone = "9876543210",
    OrderId = "GAME_PURCHASE_123",
    Description = "1000 Game Coins",
    Metadata = new Dictionary<string, string>
    {
        { "playerId", "PLAYER_123" },
        { "itemId", "COINS_1000" }
    }
};

// Create transaction
LightSpeedPaySDK.CreateTransaction(request, OnTransactionCreated, OnError);

// Callback for successful transaction creation
void OnTransactionCreated(Transaction transaction)
{
    // Open the checkout URL in a WebView or external browser
    Application.OpenURL(transaction.CheckoutUrl);
    
    // Store the transaction ID for later verification
    PlayerPrefs.SetString("PendingTransactionId", transaction.Id);
}

// Error callback
void OnError(LightSpeedError error)
{
    Debug.LogError($"Payment Error: {error.Message}");
    // Show error message to the player
}
```

### Verifying Transaction Status

After payment, verify the transaction status before granting in-game items:

```csharp
// Check transaction status (e.g., when app resumes or player returns to the game)
void VerifyPendingTransaction()
{
    string transactionId = PlayerPrefs.GetString("PendingTransactionId", "");
    
    if (!string.IsNullOrEmpty(transactionId))
    {
        LightSpeedPaySDK.GetTransaction(transactionId, OnTransactionVerified, OnError);
    }
}

void OnTransactionVerified(Transaction transaction)
{
    if (transaction.Status == "completed")
    {
        // Payment successful - grant in-game items
        GrantGameCoins(1000);
        
        // Clear the pending transaction
        PlayerPrefs.DeleteKey("PendingTransactionId");
        
        // Show success message
        ShowMessage("Payment successful! 1000 coins added to your account.");
    }
    else if (transaction.Status == "failed")
    {
        // Payment failed
        PlayerPrefs.DeleteKey("PendingTransactionId");
        ShowMessage("Payment failed. Please try again.");
    }
    // For "pending" status, keep the transaction ID stored and check again later
}
```

### Handling Deep Links

For mobile games, configure your app to handle deep links:

```csharp
void OnApplicationPause(bool pauseStatus)
{
    if (!pauseStatus) // App resumed
    {
        // Check if we have a pending transaction
        VerifyPendingTransaction();
    }
}
```

Add to your AndroidManifest.xml:

```xml
<activity android:name="com.unity3d.player.UnityPlayerActivity" ...>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="yourgame" android:host="payment" />
    </intent-filter>
</activity>
```

For iOS, add to your Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourgame</string>
        </array>
    </dict>
</array>
```

## Testing Your Integration

### Test Credentials

For sandbox testing, use these test credentials:

| Gateway | Test API Key | Test API Secret |
|---------|-------------|----------------|
| Razorpay | `rzp_test_lightspeedpay` | `testrz_secret_key` |
| PhonePe | `phonepay_test_key` | `testphone_secret` |

### Test Cards

| Card Type | Card Number | Expiry | CVV | 3D Secure Password |
|-----------|-------------|--------|-----|-------------------|
| Visa (Success) | 4111 1111 1111 1111 | Any future date | Any 3 digits | 1221 |
| Mastercard (Success) | 5555 5555 5555 4444 | Any future date | Any 3 digits | 1221 |
| Visa (Failure) | 4111 1111 1111 1111 | Any past date | Any 3 digits | 1221 |

### Test UPI IDs

For UPI testing, use these virtual IDs:
- Success: `success@lightspeed`
- Failure: `failure@lightspeed`

## Going Live

### Production Checklist

Before going live with your integration, ensure you've completed these steps:

1. Switch the SDK environment from `sandbox` to `production`
2. Replace test API keys with live API keys
3. Update the webhook URL to your production endpoint
4. Implement proper error handling for production scenarios
5. Set up monitoring and alerting for payment failures
6. Test the complete payment flow in production with small amounts
7. Ensure your privacy policy covers payment data handling
8. Update your terms of service to include payment terms

### Common Production Issues

1. **SSL/TLS Errors**: Ensure your server has valid SSL certificates and supports TLS 1.2+
2. **Rate Limiting**: Implement exponential backoff for retries
3. **Webhook Failures**: Set up webhook monitoring and failover mechanisms
4. **Database Synchronization**: Implement idempotent transaction handling
5. **Network Timeouts**: Adjust timeout settings for production environment

### Security Best Practices

1. Never store card details on your servers
2. Always verify webhook signatures
3. Use environment variables for API keys and secrets
4. Implement IP whitelisting for admin operations
5. Log all payment-related actions for audit purposes
6. Rotate API keys periodically
7. Implement strong CORS policies for your payment endpoints
8. Use parameterized queries to prevent SQL injection

For any additional questions or support, contact us at integration-support@lightspeedpay.com. 