# 🚀 LightSpeedPay Backend API Server

**Pure Node.js/Next.js API Server** for payment gateway aggregation platform. Ready for Railway deployment.

## 🏗️ **Architecture Overview**

```
Backend API Server (Railway)
├── REST API Endpoints (30+)
├── Background Workers (12)
├── Edge Functions (7)
├── Database (Supabase - 32 tables)
├── Queue System (Redis + BullMQ)
└── Authentication (JWT + Middleware)
```

---

## 📁 **Project Structure**

```
src/
├── app/api/v1/           # REST API Endpoints
│   ├── pay/              # Payment processing
│   ├── admin/            # Admin operations
│   ├── merchant/         # Merchant management
│   ├── analytics/        # Analytics & reporting
│   ├── transactions/     # Transaction management
│   ├── settlements/      # Settlement processing
│   └── wallets/          # Wallet operations
├── workers/              # Background job processors
├── lib/                  # Server utilities & services
├── middleware.ts         # Authentication & security
└── types/                # TypeScript definitions

supabase/
├── functions/            # Edge Functions (7)
└── migrations/           # Database schema (32 tables)
```

---

## 🔧 **Tech Stack**

### **Core Dependencies (Production)**
```json
{
  "@supabase/supabase-js": "^2.39.7",
  "bullmq": "^5.6.0",
  "date-fns": "^3.6.0",
  "dotenv": "^16.4.5",
  "ioredis": "^5.3.2",
  "jose": "^5.2.3",
  "lru-cache": "^10.2.0",
  "next": "14.1.0",
  "pg": "^8.11.3",
  "zod": "^3.23.8"
}
```

### **Infrastructure**
- **API Server:** Next.js (API Routes only)
- **Database:** Supabase PostgreSQL
- **Queue:** Redis + BullMQ
- **Authentication:** JWT + Middleware
- **Deployment:** Railway

---

## 🚀 **Railway Deployment**

### **1. Quick Deploy**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### **2. Manual Deployment**

**Step 1:** Connect Repository
```bash
railway login
railway link
```

**Step 2:** Set Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Queue
REDIS_URL=redis://default:password@redis-host:port

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-backend.railway.app
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_char_encryption_key

# Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
```

**Step 3:** Deploy
```bash
railway up
```

### **3. Build Configuration**

**Build Command:** `npm run build`  
**Start Command:** `npm start`  
**Node Version:** `18.x`

---

## 📋 **API Endpoints**

### **🔐 Authentication**
```bash
POST /api/v1/auth/login          # Merchant login
POST /api/v1/auth/refresh        # Refresh token
```

### **💳 Payment Processing**
```bash
POST /api/v1/pay                 # Initiate payment
GET  /api/v1/transactions        # List transactions
GET  /api/v1/transactions/:id    # Get transaction details
```

### **🏪 Merchant Management**
```bash
GET    /api/v1/merchant/:id      # Get merchant details
POST   /api/v1/merchant/credentials/regenerate
GET    /api/v1/merchant/usage    # Usage analytics
POST   /api/v1/merchant/webhooks/test
```

### **👨‍💼 Admin Operations**
```bash
GET    /api/v1/admin/gateways    # Gateway management
POST   /api/v1/admin/gateways
PUT    /api/v1/admin/gateways/:id
DELETE /api/v1/admin/gateways/:id
GET    /api/v1/admin/gateways/health

GET    /api/v1/admin/queues      # Queue management
POST   /api/v1/admin/queues/pause
POST   /api/v1/admin/queues/retry
POST   /api/v1/admin/queues/clean
GET    /api/v1/admin/queues/stats

GET    /api/v1/admin/audit-logs  # Audit logging
```

### **💰 Financial Operations**
```bash
GET    /api/v1/settlements       # Settlement management
GET    /api/v1/wallets          # Wallet operations
```

### **📊 Analytics & Monitoring**
```bash
GET    /api/v1/analytics         # Analytics data
GET    /api/v1/alerts           # System alerts
GET    /api/v1/system/status    # System health
```

---

## 🔄 **Background Workers**

### **Active Workers (12)**
```bash
├── transaction-processor        # Process payments
├── webhook-processor           # Handle webhooks
├── settlement-processor        # Process settlements  
├── commission-payout-processor # Commission payouts
├── wallet-balance-monitor      # Monitor balances
├── low-balance-notifier       # Balance alerts
├── transaction-monitor        # Transaction monitoring
├── webhook-retry              # Retry failed webhooks
├── whatsapp-sender           # WhatsApp notifications
├── worker-health-monitor     # Worker health
├── system-health-report      # System reports
└── archive-transactions      # Archive old data
```

### **Scheduled Jobs**
```bash
├── Queue Metrics Recorder      # Every 1 minute
├── SLA Monitor                # Every 5 minutes  
├── System Status Checker      # Every 10 minutes
├── Low Balance Notifier       # Every 15 minutes
├── Commission Payout          # Daily at 00:00
├── Archive Transactions       # Daily at 02:00
└── System Health Report       # Daily at 06:00
```

---

## 🔒 **Security Features**

### **Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Client key/secret validation
- ✅ Rate limiting (100 req/min)
- ✅ Role-based access control

### **Data Protection**
- ✅ AES-256 encryption for sensitive data
- ✅ Row Level Security (RLS) 
- ✅ SQL injection prevention
- ✅ CORS configuration

### **Monitoring & Auditing**
- ✅ Complete audit trail
- ✅ Real-time alerts
- ✅ Error tracking
- ✅ Performance monitoring

---

## 📊 **Database Schema**

### **Core Tables (32)**
```sql
-- Merchant Management
merchants, merchant_gateway_preferences, merchant_credentials

-- Transactions  
transactions, archived_transactions, transaction_attempts

-- Payments
payment_gateways, gateway_credentials, gateway_health_metrics

-- Financial
settlements, settlement_line_items, wallets, wallet_transactions

-- System
queues, queue_jobs, worker_health, system_status

-- Monitoring
alerts, audit_logs, api_request_logs, gateway_metrics

-- Notifications
whatsapp_queue, webhook_queue
```

---

## 🚦 **Health Checks**

### **System Status**
```bash
GET /api/health                 # Basic health check
GET /api/v1/system/status       # Detailed system status
```

### **Monitoring Endpoints**
```bash
GET /api/v1/admin/gateways/health    # Gateway health
GET /api/v1/admin/queues/stats       # Queue statistics  
GET /api/v1/analytics                # Performance metrics
```

---

## 🔧 **Local Development**

### **Prerequisites**
```bash
Node.js 18+
PostgreSQL
Redis
```

### **Setup**
```bash
# Clone repository
git clone https://github.com/shubhamyadav162/lightbackendspeed.git
cd lightbackendspeed

# Install dependencies
npm install

# Setup environment
cp env.example .env.local
# Fill in your environment variables

# Run development server
npm run dev
```

### **Testing**
```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

---

## 📝 **API Documentation**

### **Authentication**
All API endpoints require authentication via:
```bash
# Header
Authorization: Bearer <jwt_token>

# OR Client Credentials  
X-Client-Key: your_client_key
X-Client-Secret: your_client_secret
```

### **Response Format**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

### **Error Handling**
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": { ... }
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

## 🌟 **Features**

### **✅ Payment Processing**
- Multi-gateway support (Razorpay, PayU, etc.)
- Intelligent gateway routing
- Automatic failover
- Real-time status updates

### **✅ Merchant Management**  
- Self-service dashboard
- API key management
- Usage analytics
- Webhook configuration

### **✅ Financial Operations**
- Automated settlements  
- Commission tracking
- Wallet management
- Transaction reconciliation

### **✅ Monitoring & Analytics**
- Real-time dashboards
- Performance metrics
- Error tracking
- Business intelligence

---

## 🔗 **Related Repositories**

- **Frontend Dashboard:** [lightspeedpay-frontend](https://github.com/your-org/lightspeedpay-frontend)
- **Mobile SDK:** [lightspeedpay-mobile-sdk](https://github.com/your-org/lightspeedpay-mobile-sdk)
- **Documentation:** [lightspeedpay-docs](https://github.com/your-org/lightspeedpay-docs)

---

## 📞 **Support**

### **Documentation**
- [API Documentation](https://your-backend.railway.app/docs)
- [Integration Guide](https://docs.lightspeedpay.com)
- [SDKs & Libraries](https://github.com/your-org/lightspeedpay-sdks)

### **Contact**
- **Email:** support@lightspeedpay.com
- **Slack:** [Join Community](https://lightspeedpay.slack.com)
- **Issues:** [GitHub Issues](https://github.com/shubhamyadav162/lightbackendspeed/issues)

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🏆 **Production Ready**

✅ **Security Hardened**  
✅ **Performance Optimized**  
✅ **Horizontally Scalable**  
✅ **Monitoring Enabled**  
✅ **Error Handling**  
✅ **Documentation Complete**  

**Ready for production deployment on Railway! 🚀** 
