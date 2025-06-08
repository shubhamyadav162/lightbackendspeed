# Context for Cursor AI: LightSpeedPay Payment Gateway Wrapper

## 1. Project Purpose and Constraints
- **Name**: LightSpeedPay
- **Goal**: Provide a unified, highly reliable payment‐gateway wrapper for merchants.  
- **Critical requirement**: Real money transactions will occur; **nothing may fail silently**. Implement exhaustive validation, retries, monitoring, alerts, and failover to guarantee 99.9% uptime and data integrity.

---

## 2. User Roles
1. **Merchant**  
   - Registers, obtains API key/salt, creates and monitors transactions.
2. **Admin**  
   - Configures gateways, views system health and alerts, acknowledges issues.
3. **Super-Admin**  
   - Manages users/roles, global settings, audit logs, billing.

---

## 3. Authentication & Security
- **Merchant Auth Screen (API)**  
  - Input: merchant_id, timestamp, HMAC signature  
  - Output: JWT (expires in 1 hour)  
  - Validation: Reject invalid or replayed signatures  
- **Admin / Super-Admin Login**  
  - Username/password, multi-factor optional  
  - Role-based access control  
- **All APIs**  
  - HTTPS only; enforce rate limits per key; validate payloads (Zod schemas); sanitize inputs  

---

## 4. Core Data & Reliability
- **Transactions**  
  - Immutable audit trail; status PENDING→SUCCESS/FAILED/CANCELLED  
  - Retry logic: up to 3 gateway attempts with exponential back-off  
  - Consistency: ACID transactions in PostgreSQL (Supabase)  
- **Gateway Health**  
  - Heartbeat checks every 2 minutes; update success_rate & avg_response_time  
  - Automatic failover: if primary gateway fails or response > timeout, route to next  
- **Alerts & Monitoring**  
  - Types: GATEWAY_DOWN, HIGH_FAILURE_RATE, STUCK_TRANSACTION  
  - Severity levels (LOW→CRITICAL); require manual acknowledgment for CRITICAL  
  - Real-time dashboards, email/push alerts for CRITICAL  

---

## 5. Screen & API Definitions

### 5.1 Merchant Onboarding Screen (Dashboard)
- **Fields**: Merchant name, email, phone, callback URL, settlement cycle, MDR rate  
- **Outputs**: auto-generated API key and salt, sandbox toggle  
- **Validations**: email format, phone format, unique merchant name  

### 5.2 Payment Request API (`POST /api/pay`)
- **Headers**: Authorization: Bearer {JWT}  
- **Body**: amount, currency, customer_name/email/phone, payment_method (UPI/CARD/NETBANKING/WALLET), callback_url  
- **Process**:
  1. Validate JWT and payload  
  2. Create PENDING transaction record  
  3. Select gateway by priority + performance  
  4. Generate checkout_url (`/checkout/{merchant_id}/{txn_id}`)  
  5. Return `{ txn_id, checkout_url, status: PENDING }`  

### 5.3 Checkout Page (`/checkout/{merchant_id}/{txn_id}`)
- **Header**: Merchant branding (logo/name)  
- **Display**: amount, currency, transaction reference  
- **Payment options**:
  - UPI QR code & one-click intent buttons  
  - Card input form (number, expiry, CVV)  
  - Netbanking dropdown list  
  - Wallet selection  
- **Real-time status**: WebSocket updates; spinner until SUCCESS/FAILED  
- **Error handling**: show clear messages, "Try another method," auto-retry up to N times  

### 5.4 Transaction Status API (`GET /api/transaction/{txn_id}`)
- **Headers**: Authorization  
- **Returns**: id, amount, currency, status, payment_method, timestamps, failure_reason, attempts  

---

## 6. Merchant Dashboard Screens
1. **Overview**  
   - Wallet balance, recent transactions, success rate chart, pending settlements  
2. **Transactions List**  
   - Table with filters (status, date range, amount range), export CSV  
3. **Analytics**  
   - Time-series charts: daily/weekly/monthly volume & success rate; payment method breakdown  
4. **Settings**  
   - Edit webhook URL, settlement cycle, gateway preferences, rotate API keys  

---

## 7. Admin Dashboard Screens
1. **System Overview**  
   - Total merchants, total volume, gateway health summary, active alerts  
2. **Gateways Management**  
   - List gateways, toggle active/sandbox, set priority, view performance metrics  
3. **Merchants Management**  
   - List merchants, toggle active, view onboarding date, wallet balance  
4. **Alerts & Logs**  
   - Real-time alert feed, acknowledge/unacknowledge, audit log access  
5. **Analytics & Reports**  
   - Global success/failure trends, peak hours, geographic breakdown  

---

## 8. Sandbox Environment
- **Sandbox Gateway UI**  
  - Simulate payments: choose SUCCESS/FAILURE/TIMEOUT; adjustable response delay  
  - View & search test transactions; manual webhook triggers  
- **Test Card Numbers**:
  - 4111 1111 1111 1111 → SUCCESS  
  - 4000 0000 0000 0002 → FAILURE  
  - 4000 0000 0000 0069 → TIMEOUT  

---

## 9. Background Jobs & Workers
- **Transaction Monitor** (30 s): find PENDING >5 min, poll gateway, update status  
- **Gateway Health Check** (2 min): ping gateways, recalc metrics, generate alerts  
- **Settlement Processor** (daily 02:00): compute net payouts, update merchant wallets & records  
- **Alert Generator** (1 min): detect spikes/failures, send notifications  

---

## 10. SDKs & Integration
- **Web SDK** (JavaScript/TypeScript): initiatePayment(), checkStatus(), openCheckout()  
- **Unity SDK** (C#): static methods matching Web SDK functionality, sandbox toggle  

---

## 11. Non-Functional Requirements
- **Performance**: API 95th-percentile <200 ms under normal load  
- **Scalability**: stateless APIs; horizontal scaling on Vercel/Railway  
- **Reliability**: 99.9% uptime; automatic retries; queue back-pressure handling  
- **Security**: AES-256 for credentials, JWT expiry & rotation, IP whitelisting for admin, HMAC for webhooks  

---

## 12. Failure & Recovery
- **Atomicity**: roll back DB on partial failures  
- **Retries**: gateway calls use exponential back-off (max 3 attempts)  
- **Circuit Breaker**: temporarily disable failing gateways; auto-recover on health check pass  
- **Monitoring**: integrate Sentry for errors; structured logging; daily health reports  

---

## 13. Deployment Strategy
- **Version Control**: GitHub for all source code.
- **CI/CD Pipeline**: Automated deployment triggered by GitHub pushes.
  - Vercel for Frontend/API (Next.js).
  - Railway for Background Jobs (BullMQ workers).
  - Supabase for Database (PostgreSQL) and Edge Functions managed via migrations/deployments.
- **Automated Updates**: Code pushes to main branch will automatically update respective environments.

---

**End of context.**
