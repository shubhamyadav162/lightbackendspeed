# Payment Gateway Wrapper MVP - Product Development Architecture (PDA)

## Project Overview

Build a comprehensive payment gateway wrapper MVP called "LightSpeedPay" that provides unified API access to multiple payment gateways, includes a sandbox environment for testing, and supports gaming clients like Unity. The system should handle merchant onboarding, transaction processing, real-time monitoring, and administrative controls.

## Technology Stack

- **Frontend/API**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase PostgreSQL (free tier)
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Authentication**: NextAuth.js with JWT
- **Background Jobs**: BullMQ on Railway
- **Hosting**: Vercel (frontend/API), Railway (workers)
- **Validation**: Zod for input validation
- **ORM**: Prisma with Supabase
- **Monitoring**: Supabase Realtime for live updates

## Core Database Schema

### Merchants Table
```sql
- id (UUID, primary key)
- merchant_name (string, required)
- email (string, unique, required)
- phone (string, required)
- api_key (string, unique, auto-generated)
- api_salt (string, auto-generated for HMAC)
- webhook_url (string, optional)
- settlement_cycle (integer, default 7 days)
- mdr_rate (decimal, merchant discount rate)
- wallet_balance (decimal, default 0)
- is_sandbox (boolean, default true)
- is_active (boolean, default true)
- created_at, updated_at timestamps
```

### Payment Gateways Table
```sql
- id (UUID, primary key)
- pg_name (string, e.g., "Razorpay", "PayU", "LightSpeed")
- pg_code (string, unique, e.g., "RZP", "PYU", "LSP")
- api_endpoint (string, base URL)
- is_sandbox (boolean)
- is_active (boolean, default true)
- priority (integer, 1=highest)
- success_rate (decimal, updated by jobs)
- avg_response_time (integer, milliseconds)
- daily_limit (decimal, optional)
- created_at, updated_at timestamps
```

### Merchant PG Credentials Table
```sql
- id (UUID, primary key)
- merchant_id (UUID, foreign key)
- pg_id (UUID, foreign key)
- credentials (JSONB, AES-256 encrypted)
- is_active (boolean, default true)
- priority (integer, for this merchant)
- created_at, updated_at timestamps
```

### Transactions Table
```sql
- id (UUID, primary key)
- txn_id (string, unique, auto-generated)
- merchant_id (UUID, foreign key)
- pg_id (UUID, foreign key)
- amount (decimal, required)
- currency (string, default "INR")
- customer_email (string, required)
- customer_phone (string, required)
- customer_name (string, required)
- payment_method (enum: UPI, CARD, NETBANKING, WALLET)
- status (enum: PENDING, SUCCESS, FAILED, CANCELLED)
- pg_txn_id (string, from payment gateway)
- pg_response (JSONB, gateway response)
- callback_url (string, optional)
- checkout_url (string, auto-generated)
- failure_reason (string, optional)
- attempts (integer, default 1)
- is_sandbox (boolean)
- created_at, updated_at timestamps
```

### Settlements Table
```sql
- id (UUID, primary key)
- merchant_id (UUID, foreign key)
- settlement_date (date)
- gross_amount (decimal)
- fees_deducted (decimal)
- net_amount (decimal)
- txn_count (integer)
- status (enum: PENDING, PROCESSED, FAILED)
- created_at, updated_at timestamps
```

### Alerts Table
```sql
- id (UUID, primary key)
- type (enum: GATEWAY_DOWN, HIGH_FAILURE_RATE, TRANSACTION_STUCK)
- message (string)
- severity (enum: LOW, MEDIUM, HIGH, CRITICAL)
- pg_id (UUID, optional, foreign key)
- merchant_id (UUID, optional, foreign key)
- is_acknowledged (boolean, default false)
- created_at, updated_at timestamps
```

## API Endpoints Specification

### Merchant Authentication
**POST /api/auth/merchant**
- Accept: merchant_id, timestamp, signature (HMAC-SHA256)
- Verify signature using merchant's api_salt
- Return JWT token for subsequent requests
- Rate limit: 100 requests/minute per merchant

### Unified Payment API
**POST /api/pay**
- Headers: Authorization (JWT), Content-Type: application/json
- Body: amount, currency, customer_email, customer_phone, customer_name, payment_method, callback_url
- Logic: 
  - Validate merchant JWT
  - Create transaction record (status: PENDING)
  - Select best payment gateway based on priority + success_rate
  - Generate checkout_url: /checkout/[merchant_id]/[txn_id]
  - Return: txn_id, checkout_url, status
- Implement automatic gateway failover if primary fails

### Transaction Status API
**GET /api/transaction/[txn_id]**
- Headers: Authorization (JWT)
- Return: transaction details, current status, payment_method
- Include QR code data if UPI payment

### Webhook Handler
**POST /api/webhook/[pg_code]**
- Accept callbacks from payment gateways
- Verify webhook signature (gateway-specific)
- Update transaction status in database
- Trigger settlement calculation if SUCCESS
- Send merchant notification if callback_url provided

### Merchant Dashboard APIs
**GET /api/merchant/transactions**
- Query params: page, limit, status, date_from, date_to
- Return paginated transaction list with filters

**GET /api/merchant/analytics**
- Return: daily/weekly/monthly summaries, success rates, payment method breakdown
- Use Supabase real-time subscriptions for live updates

**POST /api/merchant/settings**
- Update webhook_url, settlement_cycle, gateway preferences

### Admin APIs
**GET /api/admin/gateways**
- List all payment gateways with health status
- Include real-time metrics: success_rate, avg_response_time

**POST /api/admin/gateway**
- Add/update payment gateway configuration
- Encrypt credentials before storing

**GET /api/admin/alerts**
- List system alerts with severity and acknowledgment status

## Sandbox Environment Specification

### LightSpeed Sandbox Gateway
Create a mock payment gateway that simulates real payment processing:

**Sandbox Features:**
- Simulate SUCCESS/FAILURE based on test card numbers
- Configurable response delays (100ms - 5000ms)
- Test webhook delivery
- Generate test QR codes and UPI URLs
- Support all payment methods (UPI, Cards, Net Banking)

**Test Cards:**
```
Success: 4111111111111111
Failure: 4000000000000002
Timeout: 4000000000000069
```

**Sandbox Endpoints:**
- POST /api/sandbox/process-payment
- POST /api/sandbox/webhook-test
- GET /api/sandbox/transaction-status

**Sandbox Dashboard:**
- View all test transactions
- Manually trigger webhooks
- Simulate gateway downtime
- Adjust success/failure rates

## Checkout Page Specification

### Public Checkout Route: /checkout/[merchant_id]/[txn_id]
**Features:**
- Display merchant name, amount, transaction details
- Show multiple payment options with icons
- Generate UPI QR code for scanning
- Provide UPI intent buttons for popular apps (GPay, PhonePe, Paytm, BHIM)
- Smart Intent integration: detect installed UPI apps
- Real-time payment status updates via WebSocket
- Mobile-responsive design with Tailwind CSS

**UPI Implementation:**
```
UPI URL Format: upi://pay?pa=merchant@upi&pn=MerchantName&am=100.00&tn=TxnNote&tr=TxnRef
```

**QR Code Generation:**
- Use qrcode.react library
- Include UPI URL in QR code
- Add merchant logo overlay if available

## Background Jobs Specification

### BullMQ Queue Setup on Railway
**Jobs to Implement:**

1. **Transaction Monitor Job** (every 30 seconds)
   - Query transactions with status PENDING > 5 minutes
   - Check with payment gateway for updates
   - Trigger alerts for stuck transactions

2. **Gateway Health Check Job** (every 2 minutes)
   - Ping all active gateways' test endpoints
   - Update success_rate and avg_response_time
   - Create alerts for gateway downtime

3. **Settlement Processing Job** (daily at 2 AM)
   - Find transactions ready for settlement (based on settlement_cycle)
   - Calculate fees using mdr_rate
   - Update merchant wallet_balance
   - Create settlement records

4. **Alert Generation Job** (every 1 minute)
   - Analyze transaction failure patterns
   - Generate alerts for high failure rates (>10% in 5 minutes)
   - Send notifications to admin dashboard

**Railway Deployment:**
- Use Railway's BullMQ template
- Connect to Supabase for database operations
- Set up Redis for queue management
- Configure Bull Board for queue monitoring

## Security Implementation

### API Security
- HTTPS enforcement (Vercel provides SSL)
- Rate limiting using Redis (Upstash free tier)
- JWT token expiration (1 hour)
- Request signature validation for webhook endpoints
- Input validation using Zod schemas

### Data Encryption
- AES-256 encryption for payment gateway credentials
- Hash merchant API salts before storage
- Encrypt sensitive customer data in database
- Use environment variables for encryption keys

### Access Control
- Role-based access (Merchant, Admin, Super Admin)
- API key rotation functionality
- Webhook signature verification
- IP whitelisting for admin endpoints

## Real-time Features

### Supabase Realtime Integration
**Live Updates:**
- Transaction status changes
- Payment completion notifications
- Gateway health status updates
- New alert generation

**Implementation:**
- Use Supabase broadcast channels
- Subscribe to table changes on frontend
- WebSocket connections for checkout page
- Real-time dashboard updates

## Client SDK Specification

### Unity SDK (C#)
Create a Unity package with:
```csharp
public class LightSpeedPay
{
    public static void InitiatePayment(PaymentRequest request, Action<PaymentResponse> callback)
    public static void CheckTransactionStatus(string txnId, Action<TransactionStatus> callback)
    public static void SetSandboxMode(bool enabled)
}
```

### Web SDK (JavaScript/TypeScript)
```javascript
class LightSpeedPaySDK {
    constructor(apiKey, sandboxMode = false)
    async initiatePayment(paymentData)
    async checkTransactionStatus(txnId)
    async openCheckout(checkoutUrl)
}
```

## Dashboard Specifications

### Merchant Dashboard (/dashboard/merchant)
**Pages:**
- Overview: Key metrics, recent transactions, wallet balance
- Transactions: Filterable transaction list with export to CSV
- Analytics: Charts for success rates, payment methods, time-series data
- Settings: API keys, webhook URLs, gateway preferences
- Integration: SDK documentation and code examples

### Admin Dashboard (/dashboard/admin)
**Pages:**
- Overview: System health, total transactions, gateway status
- Gateways: Configure payment gateways, set priorities, health monitoring
- Merchants: Merchant management, onboarding status, wallet management
- Transactions: Global transaction monitoring with advanced filters
- Alerts: System alerts with severity levels and acknowledgment
- Analytics: System-wide analytics and reporting

### Super Admin Dashboard (/dashboard/super-admin)
**Additional Pages:**
- User Management: Admin user creation and role assignment
- System Configuration: Global settings, feature flags
- Audit Logs: System access and configuration change logs
- Billing: Usage tracking and billing management

## Development Workflow

### Day 1 Tasks
1. **Project Setup**
   - Initialize Next.js project with TypeScript
   - Set up Supabase project and Prisma schema
   - Configure Vercel deployment
   - Set up Railway for background jobs
   - Implement Cursor AI with Supabase MCP

2. **Core Authentication**
   - Implement merchant registration
   - Create API key/salt generation
   - Build JWT authentication middleware
   - Set up HMAC signature validation

3. **Basic Payment Flow**
   - Create unified payment API endpoint
   - Implement transaction creation
   - Build webhook handler structure
   - Create checkout page with QR code generation

### Day 2 Tasks
1. **Gateway Integration**
   - Implement payment gateway abstraction layer
   - Add multi-gateway routing logic
   - Create failover mechanism
   - Set up sandbox LightSpeed gateway

2. **Dashboard Development**
   - Build merchant dashboard with transaction history
   - Create admin dashboard for gateway management
   - Implement real-time updates using Supabase
   - Add analytics and reporting features

3. **Background Jobs**
   - Set up BullMQ on Railway
   - Implement transaction monitoring jobs
   - Create gateway health check jobs
   - Build alert generation system

### Day 3 Tasks
1. **Advanced Features**
   - Implement settlement processing
   - Add wallet management
   - Create comprehensive alert system
   - Build real-time monitoring

2. **SDK and Documentation**
   - Create Unity SDK with examples
   - Build JavaScript SDK
   - Generate API documentation
   - Create integration guides

3. **Testing and Deployment**
   - Set up comprehensive testing
   - Implement CI/CD pipeline
   - Deploy to production
   - Performance optimization

## Testing Strategy

### Unit Tests
- API endpoint validation
- Database operations
- Authentication logic
- Payment gateway integration

### Integration Tests
- End-to-end payment flows
- Webhook processing
- Dashboard functionality
- Real-time updates

### Sandbox Testing
- All payment methods
- Gateway failover scenarios
- Settlement processing
- Alert generation

## Monitoring and Maintenance

### Health Monitoring
- API endpoint uptime monitoring
- Database connection monitoring
- Background job queue monitoring
- Payment gateway health checks

### Performance Monitoring
- API response times
- Database query performance
- Transaction processing speed
- Real-time update latency

### Error Tracking
- Structured logging with Winston
- Error reporting with Sentry
- Alert notifications
- Automated issue escalation

## Deployment Configuration

### Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && npm run build",
  "environmentVariables": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  }
}
```

### Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:worker",
    "healthcheckPath": "/health"
  }
}
```

### CI/CD Pipeline
- **Version Control**: GitHub will be used for all source code management.
- **Automated Deployments**: A CI/CD pipeline will be set up to automatically deploy changes upon pushes to the main branch.
  - Vercel for the Next.js Frontend/API.
  - Railway for BullMQ Background Jobs and Workers.
  - Supabase for database migrations and Edge Function deployments.
- **Deployment Strategy**: Ensures continuous integration and continuous deployment, reducing manual intervention and speeding up development cycles.


**End of context.**

This PDA provides comprehensive specifications for building the payment gateway wrapper MVP with sandbox capabilities, ensuring Cursor AI can generate the complete application following these detailed requirements.