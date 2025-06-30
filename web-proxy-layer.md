# LightSpeedPay - Web Proxy Layer Architecture

> **Version:** 1.0  
> **Last Updated:** 2025-01-22  
> **Purpose:** Payment Gateway IP Whitelisting Solution  

---

## 🎯 **Core Concept**

LightSpeedPay acts as a **Web Proxy Layer** between merchants and payment gateway providers (like EaseBuzz, Razorpay, PayU) to solve the critical **IP Whitelisting problem**.

### **The Problem We Solve:**
- Payment providers like EaseBuzz only accept traffic from pre-whitelisted IP addresses
- Merchants (gaming websites, e-commerce) can't get direct gateway accounts due to business restrictions
- If traffic comes from non-whitelisted IPs, merchant accounts get frozen/blocked
- Merchants need multiple gateway options for redundancy and load distribution

### **Our Solution:**
**LightSpeedPay = Trusted Proxy + Gateway Aggregator + Compliance Layer**

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Merchant Side     │    │  LightSpeedPay      │    │  Payment Providers  │
│    (Any IP)         │    │   Proxy Layer       │    │   (Whitelisted)     │
├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤
│ Gaming Website      │───▶│ Railway Backend     │───▶│ EaseBuzz            │
│ E-commerce App      │    │ (Fixed IP)          │    │ Razorpay            │
│ Mobile Application  │    │ Key-Salt Auth       │    │ PayU                │
└─────────────────────┘    │ Gateway Router      │    │ Other Gateways      │
                           └─────────────────────┘    └─────────────────────┘
```

---

## 🔐 **Key Components**

### **1. IP Proxy Solution**
- **Client Traffic:** Originates from any IP (gaming sites, mobile apps)
- **Proxy Server:** Railway deployment with fixed, whitelisted IP addresses
- **Gateway Communication:** All requests to payment providers come from whitelisted IPs only
- **Result:** Payment providers see only trusted, whitelisted traffic

### **2. Key-Salt Wrapper System**
```bash
# Merchant gets these credentials from us:
CLIENT_KEY: "xyz_client_key_12345"
CLIENT_SALT: "abc_client_salt_67890"
WEBHOOK_URL: "https://api.lightspeedpay.in/webhook/xyz_client_key_12345"
```

### **3. Unified API Interface**
```bash
# Single endpoint for all payment providers:
POST https://api.lightspeedpay.in/api/v1/pay

Headers:
x-api-key: xyz_client_key_12345
x-api-secret: abc_client_salt_67890

Body:
{
  "amount": 100,
  "customer_email": "user@example.com",
  "order_id": "ORDER_123",
  "payment_method": "upi"
}
```

---

## 🌊 **Payment Flow**

### **Step 1: Payment Initiation**
1. **Merchant App** sends payment request to LightSpeedPay
2. **Authentication** via Key-Salt verification
3. **Gateway Selection** - Choose best available provider
4. **Proxy Request** - Forward to payment gateway from whitelisted IP
5. **Response** - Return checkout URL to merchant

### **Step 2: Customer Payment**
1. **Redirect** customer to payment gateway page
2. **Payment Processing** - Customer completes payment on gateway
3. **Webhook Delivery** - Gateway sends webhook to our whitelisted server
4. **Status Update** - Update transaction in database

### **Step 3: Merchant Notification**
1. **Process Webhook** - Verify and parse gateway response
2. **Update Transaction** - Mark as success/failed in database  
3. **Forward Webhook** - Send notification to merchant's webhook URL
4. **Commission Tracking** - Calculate and record our fees

---

## 💡 **Business Model**

### **For Merchants:**
- ✅ **No Direct Gateway Account Needed** - We handle all PSP relationships
- ✅ **Multiple Gateway Access** - 20+ payment providers through single API
- ✅ **IP Whitelisting Handled** - No account freezing risks
- ✅ **Unified Integration** - Same API for all payment methods
- ✅ **Compliance Cover** - We handle PSP compliance requirements

### **For LightSpeedPay:**
- 💰 **Commission per Transaction** - 3-5% fee on successful payments
- 📈 **Volume-based Pricing** - Higher volume = better rates
- 🏦 **Split Settlement** - Automatic commission deduction via PSP APIs
- 🔄 **Subscription Revenue** - Monthly/yearly gateway access fees

### **For Payment Providers:**
- 📊 **Higher Transaction Volume** - Multiple merchants through single integration
- 🛡️ **Reduced Risk** - We handle merchant compliance and monitoring
- 💼 **B2B Relationship** - Deal with one trusted aggregator vs many merchants

---

## 🔧 **Technical Implementation**

### **Backend Stack:**
- **Framework:** Next.js API Routes + Supabase Edge Functions
- **Database:** PostgreSQL (Supabase) with Row Level Security
- **Queue System:** BullMQ + Redis for async processing
- **Deployment:** Railway (fixed IP) + Supabase (global edge)
- **Monitoring:** Grafana + Prometheus + Logtail

### **Gateway Integration:**
```typescript
// Each gateway has dedicated adapter
class EasebuzzAdapter extends BaseGatewayAdapter {
  async initiatePayment(request: PaymentRequest) {
    // Call EaseBuzz API from our whitelisted IP
    const response = await fetch('https://pay.easebuzz.in/payment/initiateLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: this.buildPaymentPayload(request)
    });
    
    // Return LightSpeed-branded response
    return LightSpeedWrapper.sanitizeResponse(response);
  }
}
```

### **Database Schema:**
- **clients** - Merchant credentials and configuration
- **payment_gateways** - Pool of 20+ gateway credentials  
- **transactions** - All payment attempts and status
- **webhook_events** - Outbound notifications to merchants
- **wallets** - Commission tracking and payouts

---

## 🎯 **Proxy Layer Benefits**

### **IP Management:**
- **Single Point Control** - Manage all gateway IPs from one place
- **Automatic Failover** - Switch gateways if one gets blocked
- **Load Distribution** - Spread traffic across multiple gateways
- **Monitoring** - Real-time gateway health and response tracking

### **Security:**
- **Credential Protection** - Gateway API keys never exposed to merchants
- **Request Validation** - All incoming requests authenticated and sanitized
- **Webhook Verification** - Cryptographic verification of all gateway callbacks
- **Audit Trail** - Complete log of all transactions and gateway interactions

### **Reliability:**
- **Redundancy** - 20+ gateways for high availability
- **Queue System** - Async processing prevents blocking
- **Retry Logic** - Automatic retry on failed gateway requests
- **Health Monitoring** - Automatic gateway rotation on failures

---

## 📊 **Gateway Pool Management**

### **Selection Algorithm:**
1. **Filter Active Gateways** - Only use gateways with `is_active = true`
2. **Check Volume Limits** - Skip gateways near monthly limits
3. **Priority Sorting** - Prefer high-priority, high-success-rate gateways
4. **Load Balancing** - Distribute requests evenly
5. **Failover** - Auto-switch on errors or timeouts

### **Real-time Monitoring:**
- **Success Rate Tracking** - Per-gateway success percentages
- **Response Time Monitoring** - Latency metrics for each provider
- **Volume Tracking** - Daily/monthly transaction counts
- **Error Rate Alerts** - Automated notifications on failures

---

## 🚀 **Deployment Strategy**

### **Phase 1: Single Gateway (EaseBuzz)**
- ✅ Deploy Railway backend with EaseBuzz integration
- ✅ Configure whitelisted IP with EaseBuzz
- ✅ Test complete payment flow end-to-end
- ✅ Verify webhook delivery and processing

### **Phase 2: Multiple Gateways**
- 🔄 Add Razorpay, PayU, and other major providers
- 🔄 Implement gateway rotation and selection logic
- 🔄 Add admin dashboard for gateway management
- 🔄 Create monitoring and alerting system

### **Phase 3: Scale & Optimize**
- 🔄 Add advanced features (split payments, recurring)
- 🔄 Implement AI-based routing optimization
- 🔄 Add comprehensive analytics and reporting
- 🔄 Create white-label solutions for large merchants

---

## 📋 **Integration Example**

### **Merchant Integration Steps:**
```bash
# 1. Get credentials from LightSpeedPay
CLIENT_KEY="lsp_merchant_xyz_2025"
CLIENT_SALT="lsp_salt_abc123def456ghi789"

# 2. Implement payment initiation
curl -X POST https://api.lightspeedpay.in/api/v1/pay \
  -H "x-api-key: $CLIENT_KEY" \
  -H "x-api-secret: $CLIENT_SALT" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "customer_email": "user@example.com",
    "order_id": "ORDER_123",
    "payment_method": "upi"
  }'

# 3. Handle webhook notifications
POST https://merchant-website.com/webhook
{
  "transaction_id": "lsp_txn_123",
  "status": "success",
  "amount": 100,
  "gateway_txn_id": "easebuzz_pay_456"
}
```

---

## 🎉 **Success Criteria**

### **For Merchants:**
- ✅ Payment success rate > 95%
- ✅ Integration time < 2 hours
- ✅ No IP whitelisting issues
- ✅ Real-time transaction status
- ✅ Multiple payment methods support

### **For LightSpeedPay:**
- ✅ Commission collection rate > 98%
- ✅ Gateway uptime > 99.5%
- ✅ Average response time < 3 seconds
- ✅ Zero gateway account suspensions
- ✅ Monthly revenue growth > 20%

---

## 🔮 **Future Enhancements**

### **Advanced Features:**
- **AI-Powered Routing** - Machine learning for optimal gateway selection
- **Smart Retry Logic** - Intelligent failover based on error patterns
- **Fraud Detection** - Real-time transaction risk assessment
- **Analytics Dashboard** - Comprehensive reporting for merchants

### **Business Expansion:**
- **International Gateways** - Support for global payment providers
- **Cryptocurrency Support** - Bitcoin, USDT payment integration
- **White-Label Solutions** - Custom-branded payment pages
- **API Marketplace** - Additional fintech services integration

---

## 📞 **Support & Documentation**

### **Developer Resources:**
- **API Documentation** - Complete endpoint reference
- **SDK Libraries** - JavaScript, Python, PHP, Java
- **Integration Guides** - Step-by-step tutorials
- **Webhook Testing** - Online webhook testing tools

### **Monitoring & Support:**
- **24/7 Monitoring** - Real-time system health tracking
- **Developer Support** - Slack/Discord community
- **Status Page** - Public uptime and incident tracking
- **SLA Guarantees** - 99.9% uptime commitment

---

**🎯 Summary:** LightSpeedPay's Web Proxy Layer solves the critical IP whitelisting problem while providing merchants with unified access to multiple payment gateways through a single, reliable API. We handle all the complexity so merchants can focus on their core business. 