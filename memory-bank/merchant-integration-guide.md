# LightSpeedPay - Merchant Integration Guide

## Overview
This guide provides step-by-step instructions for integrating the LightSpeedPay payment gateway wrapper into your application. LightSpeedPay provides a unified API to access multiple payment gateways, ensuring high reliability and seamless payment processing.

## Getting Started

### Prerequisites
- A LightSpeedPay merchant account
- API credentials (Merchant ID and API Key)
- Basic understanding of REST APIs
- Development environment with Node.js 16+ (for JavaScript SDK)

### Integration Options
LightSpeedPay offers multiple integration methods:

1. **Direct API Integration** - RESTful API calls from your backend
2. **JavaScript SDK** - Simplified client-side integration
3. **Unity SDK** - For game developers
4. **Hosted Checkout Page** - No coding required, redirect your customers

## API Integration

### Authentication
All API requests require authentication using your Merchant ID and API Key.

```javascript
// Example headers
const headers = {
  'Content-Type': 'application/json',
  'X-Merchant-ID': 'your_merchant_id',
  'X-API-Key': 'your_api_key'
};
```

### Create a Transaction

```javascript
// Example request
const response = await fetch('https://api.lightspeedpay.com/v1/transactions', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    amount: 1000.00,  // Amount in INR
    currency: 'INR',
    description: 'Test Payment',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210'
    },
    redirect: {
      success: 'https://yourwebsite.com/success',
      failure: 'https://yourwebsite.com/failure'
    }
  })
});

const data = await response.json();
// data.checkout_url - Redirect customer to this URL to complete payment
// data.transaction_id - Store this for future reference
```

### Check Transaction Status

```javascript
const response = await fetch(`https://api.lightspeedpay.com/v1/transactions/${transaction_id}`, {
  method: 'GET',
  headers: headers
});

const data = await response.json();
// data.status - Transaction status (pending, success, failed)
// data.gateway_response - Detailed response from the payment gateway
```

## JavaScript SDK Integration

### Installation

```bash
npm install lightspeedpay-sdk
# or
yarn add lightspeedpay-sdk
```

### Basic Usage

```javascript
import { LightSpeedPay } from 'lightspeedpay-sdk';

// Initialize the SDK
const lsp = new LightSpeedPay({
  merchantId: 'your_merchant_id',
  apiKey: 'your_api_key',
  environment: 'production' // or 'sandbox' for testing
});

// Create a transaction
const transaction = await lsp.createTransaction({
  amount: 1000.00,
  currency: 'INR',
  description: 'Product Purchase',
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210'
  }
});

// Redirect to checkout
window.location.href = transaction.checkout_url;

// Later, check status
const status = await lsp.getTransactionStatus(transaction.transaction_id);
console.log(status);
```

## Unity SDK Integration

### Installation
1. Download the Unity package from your merchant dashboard
2. Import the package into your Unity project via Assets > Import Package > Custom Package

### Basic Usage

```csharp
using LightSpeedPay;

// Initialize the SDK
LSPClient client = new LSPClient("your_merchant_id", "your_api_key");

// Create a transaction
Dictionary<string, object> transactionParams = new Dictionary<string, object>
{
    { "amount", 1000.00f },
    { "currency", "INR" },
    { "description", "In-game Purchase" },
    { "customer", new Dictionary<string, string>
        {
            { "name", "Player Name" },
            { "email", "player@example.com" },
            { "phone", "+919876543210" }
        }
    }
};

client.CreateTransaction(transactionParams, (response) => {
    // Handle the transaction response
    string transactionId = response["transaction_id"].ToString();
    string checkoutUrl = response["checkout_url"].ToString();
    
    // Open checkout URL in an in-game browser or external browser
    Application.OpenURL(checkoutUrl);
});

// Later, check status
client.GetTransactionStatus(transactionId, (statusResponse) => {
    string status = statusResponse["status"].ToString();
    Debug.Log("Transaction status: " + status);
});
```

## Hosted Checkout Integration

For the simplest integration, use our hosted checkout page:

1. Create a payment button on your website
2. When clicked, make a server-side API call to create a transaction
3. Redirect the customer to the returned `checkout_url`
4. Customer completes payment on our secure hosted page
5. Customer is redirected back to your success/failure URL
6. Check transaction status via API or webhooks

```html
<!-- Example payment button -->
<button onclick="redirectToPayment()">Pay Now</button>

<script>
async function redirectToPayment() {
  // Make server-side API call to create transaction and get checkout URL
  const response = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 1000.00,
      currency: 'INR',
      description: 'Product Purchase'
    })
  });
  
  const data = await response.json();
  window.location.href = data.checkout_url;
}
</script>
```

## Webhook Integration

Set up webhooks to receive real-time notifications about transaction events:

1. Log in to your merchant dashboard
2. Navigate to Settings > Webhooks
3. Add a new webhook URL (must be HTTPS)
4. Select events you want to receive notifications for

```javascript
// Example webhook handler (Express.js)
app.post('/webhooks/lightspeedpay', express.json(), (req, res) => {
  const event = req.body;
  
  // Verify webhook signature
  const signature = req.headers['x-lsp-signature'];
  const isValid = verifySignature(event, signature, webhookSecret);
  
  if (!isValid) {
    return res.status(400).send('Invalid signature');
  }
  
  // Handle different event types
  switch (event.type) {
    case 'transaction.success':
      // Update order status, trigger fulfillment, etc.
      break;
    case 'transaction.failed':
      // Notify customer, log failure reason, etc.
      break;
    case 'transaction.refunded':
      // Update order status, trigger refund workflow, etc.
      break;
  }
  
  res.status(200).send('Webhook received');
});

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  return calculatedSignature === signature;
}
```

## Testing

### Sandbox Environment
Use our sandbox environment for testing without making real payments:

1. Set `environment: 'sandbox'` in SDK initialization
2. Use test card numbers and UPI IDs from the table below

### Test Payment Methods

| Payment Method | Test Credentials | Behavior |
|----------------|------------------|----------|
| Credit Card    | 4111 1111 1111 1111, Exp: Any future date, CVV: Any 3 digits | Success |
| Credit Card    | 4242 4242 4242 4242, Exp: Any future date, CVV: Any 3 digits | Success |
| Credit Card    | 4000 0000 0000 0002, Exp: Any future date, CVV: Any 3 digits | Failed (Insufficient funds) |
| UPI            | success@lsptest | Success |
| UPI            | failure@lsptest | Failed |
| Net Banking    | Any bank, username: demo, password: demo123 | Success |

## Best Practices

1. **Error Handling**: Implement robust error handling for API calls and webhook processing
2. **Idempotency**: Use unique idempotency keys for repeated transaction attempts
3. **Reconciliation**: Implement daily reconciliation of transactions
4. **Security**: Never store sensitive payment data, use tokenization
5. **Logging**: Maintain comprehensive logs for debugging and auditing

## Common Issues and Troubleshooting

### API Connection Issues
- Verify network connectivity
- Check API credentials
- Ensure correct endpoint URLs

### Transaction Failures
- Verify transaction parameters (amount, currency)
- Check customer information format
- Review gateway-specific error codes

### Webhook Issues
- Ensure webhook URL is publicly accessible
- Verify webhook signature validation
- Check server logs for request details

## Support

For additional support:
- Developer Documentation: [https://docs.lightspeedpay.com](https://docs.lightspeedpay.com)
- Support Email: support@lightspeedpay.com
- Developer Forum: [https://community.lightspeedpay.com](https://community.lightspeedpay.com)
- Support Ticket: Available in your merchant dashboard 