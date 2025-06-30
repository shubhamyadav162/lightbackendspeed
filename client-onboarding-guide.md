# 🚀 Real Client Onboarding Guide - EaseBuzz LightSpeedPay

> **System Status:** ✅ **EaseBuzz 100% Production Ready!**  
> **Backend:** `https://web-production-0b337.up.railway.app`  
> **EaseBuzz Credentials:** D4SS5CFXKV + HRQ1A10K7J (Live)

---

## 🎯 **Client Onboarding Process (5 Steps)**

### **Step 1: Create Merchant Account**

**API Call:**
```bash
POST https://web-production-0b337.up.railway.app/api/v1/admin/merchants
Content-Type: application/json
x-api-key: admin_test_key

{
  "merchant_name": "Your Client Business Name",
  "email": "client@example.com", 
  "phone": "+91 9999999999",
  "business_type": "gaming",
  "webhook_url": "https://client-website.com/lightspeed-webhook"
}
```

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": "merchant_uuid_12345",
    "api_key": "lsp_client_abc123def456",
    "api_salt": "lsp_salt_xyz789ghi012",
    "webhook_url": "https://client-website.com/lightspeed-webhook"
  }
}
```

### **Step 2: Test Payment Integration**

**Client Implementation:**
```bash
# Test Payment API Call
POST https://web-production-0b337.up.railway.app/api/v1/pay
Content-Type: application/json
x-api-key: lsp_client_abc123def456
x-api-secret: lsp_salt_xyz789ghi012

{
  "amount": 100,
  "customer_email": "test@example.com",
  "customer_name": "Test User",
  "customer_phone": "9999999999",
  "test_mode": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "transaction_id": "LSP_TXN_12345",
  "checkout_url": "https://testpay.easebuzz.in/payment/initiateLink?...",
  "status": "pending",
  "gateway": "LightSpeed Payment Gateway"
}
```

### **Step 3: EaseBuzz Dashboard Configuration**

Client को EaseBuzz dashboard में यह setup करना होगा:

**Webhook URL:** `https://api.lightspeedpay.in/api/v1/callback/easebuzzp`  
**Success URL:** `https://client-website.com/payment-success`  
**Failure URL:** `https://client-website.com/payment-failed`

### **Step 4: Webhook Handler (Client Side)**

```javascript
// Client के website पर webhook handler
app.post('/lightspeed-webhook', (req, res) => {
  const {
    transaction_id,    // LSP_TXN_12345
    status,           // success/failed/cancelled 
    amount,           // amount in paisa
    gateway           // "LightSpeed Payment Gateway"
  } = req.body;

  // Update order status in client's database
  updateOrderStatus(transaction_id, status);
  
  res.json({ success: true });
});
```

### **Step 5: Go Live**

1. **Test Mode → Production:**
   ```bash
   # Update merchant to production mode
   PUT /api/v1/admin/merchants/{merchant_id}
   {
     "is_sandbox": false,
     "environment": "production"
   }
   ```

2. **EaseBuzz Dashboard:** Test → Production environment switch

---

## 🔧 **Developer Integration Code**

### **PHP Integration:**
```php
<?php
$client_key = 'lsp_client_abc123def456';
$client_salt = 'lsp_salt_xyz789ghi012';

// Payment initiation
$payment_data = [
    'amount' => 10000, // ₹100 in paisa
    'customer_email' => 'user@example.com',
    'customer_name' => 'Customer Name',
    'test_mode' => false
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://web-production-0b337.up.railway.app/api/v1/pay');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $client_key,
    'x-api-secret: ' . $client_salt
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payment_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);

if ($result['success']) {
    // Redirect to payment page
    header('Location: ' . $result['checkout_url']);
}
?>
```

### **JavaScript Integration:**
```javascript
// Payment initiation
async function initiatePayment(amount, customerEmail) {
    const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'lsp_client_abc123def456',
            'x-api-secret': 'lsp_salt_xyz789ghi012'
        },
        body: JSON.stringify({
            amount: amount,
            customer_email: customerEmail,
            test_mode: false
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        // Redirect to payment URL
        window.location.href = result.checkout_url;
    }
}
```

---

## 📊 **Monitoring & Analytics**

### **Transaction Tracking:**
```bash
# Get all transactions for merchant
GET /api/v1/transactions
Headers: x-api-key, x-api-secret

# Get specific transaction
GET /api/v1/transactions/{transaction_id}
Headers: x-api-key, x-api-secret
```

### **Wallet Balance:**
```bash
# Check merchant wallet balance
GET /api/v1/wallets
Headers: x-api-key, x-api-secret
```

---

## 🎯 **Real Client Checklist**

### **✅ Pre-Go-Live:**
- [ ] Merchant account created in database
- [ ] API credentials generated and shared
- [ ] Test payment completed successfully
- [ ] Webhook handler implemented and tested
- [ ] EaseBuzz dashboard configured
- [ ] Production environment verified

### **✅ Go-Live:**
- [ ] Switch to production mode (`test_mode: false`)
- [ ] EaseBuzz dashboard: Test → Production
- [ ] Real money transaction tested
- [ ] Webhook delivery confirmed
- [ ] Commission settlement verified

---

## 🚨 **Support & Troubleshooting**

### **Common Issues:**

1. **Payment Fails:**
   - Check EaseBuzz credentials (D4SS5CFXKV, HRQ1A10K7J)
   - Verify webhook URL in EaseBuzz dashboard
   - Check transaction logs

2. **Webhook Not Received:**
   - Verify webhook URL: `https://api.lightspeedpay.in/api/v1/callback/easebuzzp`
   - Check client webhook handler
   - Verify hash signature

3. **API Authentication:**
   - Verify API key and salt
   - Check headers: `x-api-key`, `x-api-secret`
   - Ensure merchant account is active

### **Contact Support:**
- **Backend Logs:** Railway deployment logs
- **Database:** Supabase dashboard
- **Real-time Monitoring:** Available through admin APIs

---

## 🎉 **Success Metrics**

**✅ Client Successfully Onboarded When:**
- Test payment: ✅ Working
- Production payment: ✅ Working  
- Webhook delivery: ✅ Working
- Commission tracking: ✅ Working
- Client integration: ✅ Complete

---

**🚀 Ready for Real Client Onboarding!**

**System:** 100% Production Ready  
**EaseBuzz:** Live Integration  
**Backend:** Railway Deployed  
**Support:** 24/7 Available 