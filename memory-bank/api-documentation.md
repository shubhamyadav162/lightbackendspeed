# LightSpeedPay API Documentation

This document provides comprehensive documentation for the LightSpeedPay API, including endpoints, request/response formats, and examples.

## Base URL

```
https://api.lightspeedpay.com/v1
```

## Authentication

All API requests require authentication using Bearer tokens. Include the following header in all requests:

```
Authorization: Bearer <YOUR_API_KEY>
```

## Response Format

All responses follow a standard format:

```json
{
  "success": true|false,
  "data": { ... },  // Present on successful requests
  "error": {        // Present on failed requests
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per API key. Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1620000000
```

## Endpoints

### Merchants

#### Create Merchant Account

```
POST /merchants
```

Request:
```json
{
  "name": "Merchant Name",
  "email": "merchant@example.com",
  "password": "SecurePassword123!",
  "businessName": "Business Name",
  "businessType": "retail",
  "businessAddress": "123 Business St, City, State, ZIP",
  "phoneNumber": "1234567890",
  "panNumber": "ABCDE1234F",
  "gstNumber": "29ABCDE1234F1Z5",
  "websiteUrl": "https://example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "mer_123456789",
    "name": "Merchant Name",
    "email": "merchant@example.com",
    "businessName": "Business Name",
    "apiKey": "api_key_123456789"
  }
}
```

#### Get Merchant Details

```
GET /merchants/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "mer_123456789",
    "name": "Merchant Name",
    "email": "merchant@example.com",
    "businessName": "Business Name",
    "businessType": "retail",
    "businessAddress": "123 Business St, City, State, ZIP",
    "phoneNumber": "1234567890",
    "panNumber": "ABCDE1234F",
    "gstNumber": "29ABCDE1234F1Z5",
    "websiteUrl": "https://example.com",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Update Merchant Details

```
PATCH /merchants/:id
```

Request:
```json
{
  "businessAddress": "456 New Address St, City, State, ZIP",
  "phoneNumber": "0987654321",
  "websiteUrl": "https://new-example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "mer_123456789",
    "businessAddress": "456 New Address St, City, State, ZIP",
    "phoneNumber": "0987654321",
    "websiteUrl": "https://new-example.com",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
}
```

### Transactions

#### Create Transaction

```
POST /transactions
```

Request:
```json
{
  "amount": 1000.00,
  "currency": "INR",
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210",
  "orderId": "ORD123456",
  "description": "Order payment",
  "callbackUrl": "https://merchant.com/callback",
  "gatewayPreference": "razorpay",
  "metadata": {
    "productId": "PROD123",
    "customerId": "CUST456"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "txn_987654321",
    "amount": 1000.00,
    "currency": "INR",
    "status": "initiated",
    "gatewayName": "razorpay",
    "gatewayTxnId": "pay_123456789",
    "merchantId": "mer_123456789",
    "checkoutUrl": "https://checkout.lightspeedpay.com/mer_123456789/txn_987654321",
    "createdAt": "2023-01-03T00:00:00Z"
  }
}
```

#### Get Transaction Details

```
GET /transactions/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "txn_987654321",
    "amount": 1000.00,
    "currency": "INR",
    "status": "completed",
    "gatewayName": "razorpay",
    "gatewayTxnId": "pay_123456789",
    "merchantId": "mer_123456789",
    "customerEmail": "customer@example.com",
    "customerPhone": "9876543210",
    "orderId": "ORD123456",
    "description": "Order payment",
    "metadata": {
      "productId": "PROD123",
      "customerId": "CUST456"
    },
    "paymentMethod": "card",
    "cardNetwork": "Visa",
    "cardLast4": "4242",
    "createdAt": "2023-01-03T00:00:00Z",
    "updatedAt": "2023-01-03T00:05:00Z",
    "completedAt": "2023-01-03T00:05:00Z"
  }
}
```

#### List Transactions

```
GET /transactions?merchantId=mer_123456789&status=completed&startDate=2023-01-01&endDate=2023-01-31&limit=10&offset=0
```

Response:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_987654321",
        "amount": 1000.00,
        "currency": "INR",
        "status": "completed",
        "gatewayName": "razorpay",
        "createdAt": "2023-01-03T00:00:00Z",
        "completedAt": "2023-01-03T00:05:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Gateways

#### List Available Gateways

```
GET /gateways
```

Response:
```json
{
  "success": true,
  "data": {
    "gateways": [
      {
        "id": "gw_razorpay",
        "name": "Razorpay",
        "description": "Razorpay payment gateway",
        "logoUrl": "https://lightspeedpay.com/images/gateways/razorpay.png",
        "status": "active",
        "supportedPaymentMethods": ["card", "netbanking", "upi", "wallet"]
      },
      {
        "id": "gw_phonepe",
        "name": "PhonePe",
        "description": "PhonePe payment gateway",
        "logoUrl": "https://lightspeedpay.com/images/gateways/phonepe.png",
        "status": "active",
        "supportedPaymentMethods": ["upi", "wallet", "card"]
      }
    ]
  }
}
```

#### Add Gateway Credentials

```
POST /merchants/:merchantId/gateways
```

Request:
```json
{
  "gatewayId": "gw_razorpay",
  "apiKey": "rzp_test_123456789",
  "apiSecret": "secret_abcdefghijklmn",
  "isActive": true,
  "priority": 1
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "mgw_123456789",
    "merchantId": "mer_123456789",
    "gatewayId": "gw_razorpay",
    "isActive": true,
    "priority": 1,
    "createdAt": "2023-01-04T00:00:00Z"
  }
}
```

### Settlements

#### List Settlements

```
GET /settlements?merchantId=mer_123456789&status=completed&startDate=2023-01-01&endDate=2023-01-31&limit=10&offset=0
```

Response:
```json
{
  "success": true,
  "data": {
    "settlements": [
      {
        "id": "stl_123456789",
        "merchantId": "mer_123456789",
        "amount": 9700.00,
        "fees": 300.00,
        "netAmount": 9400.00,
        "currency": "INR",
        "status": "completed",
        "transactionCount": 10,
        "settlementDate": "2023-01-15T00:00:00Z",
        "accountNumber": "XXXX1234",
        "bankName": "HDFC Bank",
        "utrNumber": "UTRNUMBER123456789",
        "createdAt": "2023-01-15T00:00:00Z",
        "completedAt": "2023-01-15T06:00:00Z"
      }
    ],
    "pagination": {
      "total": 4,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Get Settlement Details

```
GET /settlements/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "stl_123456789",
    "merchantId": "mer_123456789",
    "amount": 9700.00,
    "fees": 300.00,
    "netAmount": 9400.00,
    "currency": "INR",
    "status": "completed",
    "transactionCount": 10,
    "settlementDate": "2023-01-15T00:00:00Z",
    "accountNumber": "XXXX1234",
    "bankName": "HDFC Bank",
    "utrNumber": "UTRNUMBER123456789",
    "transactions": [
      {
        "id": "txn_987654321",
        "amount": 1000.00,
        "fees": 30.00,
        "netAmount": 970.00,
        "status": "completed",
        "createdAt": "2023-01-03T00:00:00Z"
      }
    ],
    "createdAt": "2023-01-15T00:00:00Z",
    "completedAt": "2023-01-15T06:00:00Z"
  }
}
```

### Webhooks

#### Configure Webhook URL

```
POST /merchants/:merchantId/webhooks
```

Request:
```json
{
  "url": "https://merchant.com/webhook",
  "events": ["transaction.completed", "transaction.failed", "settlement.completed"],
  "secret": "webhook_secret_key"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "wh_123456789",
    "url": "https://merchant.com/webhook",
    "events": ["transaction.completed", "transaction.failed", "settlement.completed"],
    "createdAt": "2023-01-05T00:00:00Z"
  }
}
```

#### Test Webhook

```
POST /merchants/:merchantId/webhooks/:webhookId/test
```

Response:
```json
{
  "success": true,
  "data": {
    "sent": true,
    "statusCode": 200,
    "response": "Webhook received successfully"
  }
}
```

## Webhook Events

When a webhook event is triggered, LightSpeedPay will send a POST request to your configured webhook URL with the following format:

```json
{
  "id": "evt_123456789",
  "type": "transaction.completed",
  "createdAt": "2023-01-03T00:05:00Z",
  "data": {
    "id": "txn_987654321",
    "status": "completed"
  }
}
```

The request will include an `X-Signature` header that contains a HMAC SHA-256 signature created using your webhook secret. You should verify this signature to ensure the webhook came from LightSpeedPay.

### Event Types

| Event Type | Description |
|------------|-------------|
| `transaction.initiated` | A new transaction has been initiated |
| `transaction.completed` | A transaction has been successfully completed |
| `transaction.failed` | A transaction has failed |
| `transaction.refunded` | A transaction has been refunded |
| `settlement.initiated` | A settlement process has been initiated |
| `settlement.completed` | A settlement has been completed |
| `settlement.failed` | A settlement has failed |

## Error Codes

| Error Code | Description |
|------------|-------------|
| `invalid_request` | The request was invalid or poorly formatted |
| `authentication_error` | Authentication failed |
| `insufficient_permissions` | The API key doesn't have permission to perform the request |
| `rate_limit_exceeded` | Rate limit has been exceeded |
| `gateway_error` | An error occurred with the payment gateway |
| `transaction_failed` | Transaction processing failed |
| `invalid_transaction_state` | The transaction is in an invalid state for the requested operation |
| `merchant_not_found` | The specified merchant couldn't be found |
| `transaction_not_found` | The specified transaction couldn't be found |
| `server_error` | An internal server error occurred |

## SDK Integration

For easy integration, we provide SDKs for various programming languages. Please refer to our [SDK Documentation](https://docs.lightspeedpay.com/sdks) for detailed implementation guides.

## Support

If you need assistance with API integration or have any questions, please contact our support team at api-support@lightspeedpay.com or visit our [Developer Forum](https://forum.lightspeedpay.com). 