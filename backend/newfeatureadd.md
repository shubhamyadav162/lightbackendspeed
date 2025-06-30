# LightSpeedPay – AI-Optimized Integration Blueprint
> **CRITICAL**: Backend MUST be completed 100% before ANY frontend work begins
> 
> Version 2.0 | Last updated 2025-06-20

---

## 🎯 PROJECT CONTEXT & EXECUTION ORDER

### What We're Building
LightSpeedPay is a **payment aggregator SaaS** that allows merchants to process payments through multiple PSPs (Razorpay, PayU, etc.) without direct accounts. We act as a technical wrapper while merchants retain ownership of funds.

### 🚨 MANDATORY EXECUTION SEQUENCE
```
PHASE 1: Backend Infrastructure (Weeks 1-4)
├── Database schema & migrations
├── Supabase Edge Functions
├── Railway worker services
├── Queue system (BullMQ + Redis)
└── API endpoints & testing

PHASE 2: Frontend Integration (Weeks 5-6)
├── Update existing admin dashboard
├── Add new management pages
└── Connect to backend APIs

PHASE 3: Testing & Deployment (Week 7)
├── End-to-end testing
└── Production deployment
```

**⚠️ AI CONSTRAINT**: Do NOT create any frontend components until ALL backend tasks in Phase 1 are marked COMPLETE.

---

## 📊 CURRENT SYSTEM STATE

### Existing Infrastructure
- ✅ Supabase project with basic auth
- ✅ Next.js admin dashboard (basic)
- ✅ Railway account setup
- ✅ Domain configured

### What's Missing (Our Tasks)
- ✅ Payment processing backend (completed – see Edge Functions & workers)
- ✅ Queue system for high volume (BullMQ workers & metrics)
- ✅ Gateway rotation logic (select_gateway_for_amount RPC & worker integration)
- ✅ Commission tracking (wallets & commission_entries + payout processor)
- ✅ WhatsApp notifications (whatsapp-sender worker & notifier flows)
- ✅ Enhanced admin dashboard (Next.js pages & React Query hooks)

---

## 🗂️ DATABASE SCHEMA (PHASE 1 - TASK 1)

### Required Tables & Exact Schema

```sql
-- 1. Client Management
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key VARCHAR(32) UNIQUE NOT NULL,
  client_salt VARCHAR(64) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500),
  fee_percent DECIMAL(5,2) DEFAULT 3.50,
  suspend_threshold INTEGER DEFAULT 10000,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gateway Pool Management  
CREATE TABLE payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'razorpay_1', 'payu_2'
  provider VARCHAR(50) NOT NULL, -- 'razorpay', 'payu'
  api_key VARCHAR(100) NOT NULL,
  api_secret VARCHAR(100) NOT NULL,
  monthly_limit INTEGER DEFAULT 1000000,
  current_volume INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  temp_failed BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transaction Processing
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(100) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  gateway_id UUID REFERENCES payment_gateways(id),
  customer_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- in paisa
  status VARCHAR(20) DEFAULT 'created',
  gateway_txn_id VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Webhook Management
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  attempts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Commission Tracking
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) UNIQUE,
  balance_due INTEGER DEFAULT 0, -- commission owed in paisa
  warn_threshold INTEGER DEFAULT 5000,
  wa_last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  transaction_id UUID REFERENCES transactions(id),
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'COMMISSION', 'COMMISSION_PAYOUT'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, transaction_id)
);

-- 6. Queue Monitoring
CREATE TABLE queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(50) NOT NULL,
  waiting INTEGER DEFAULT 0,
  active INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WhatsApp Notifications
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  template VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'LOW_BALANCE', 'TXN_UPDATE'
  payload_json JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whatsapp_provider_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
```sql
-- Admin-only access for most tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policies (service_role bypasses all)
CREATE POLICY "Admin only" ON clients FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only" ON payment_gateways FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only" ON transactions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only" ON wallets FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🔧 BACKEND ARCHITECTURE (PHASE 1 - TASKS 2-8)

### Task 2: Supabase Edge Functions

#### Function 1: payment-initiate
**Path**: `/supabase/functions/payment-initiate/index.ts`

```typescript
// EXACT implementation required:
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Queue } from 'https://esm.sh/bullmq@3'

interface PaymentRequest {
  amount: number
  order_id: string
  client_key: string
  client_salt: string
  redirect_url?: string
}

serve(async (req) => {
  // 1. Validate HMAC signature
  // 2. Get client from database
  // 3. Check balance_due vs suspend_threshold
  // 4. Select available gateway using rotation logic
  // 5. Enqueue job in 'transaction-processing' queue
  // 6. Return transaction_id immediately
})
```

#### Function 2: webhook-handler  
**Path**: `/supabase/functions/webhook-handler/index.ts`

```typescript
serve(async (req) => {
  const clientKey = req.url.split('/').pop()
  
  // 1. Verify webhook signature from PSP
  // 2. Enqueue job in 'webhook-processing' queue
  // 3. Return 200 OK immediately
})
```

### Task 3: Railway Worker Services

Create **3 separate Railway services** within same project:

#### Service 1: transaction-processor
**Path**: `/workers/transaction-processor/index.ts`

```typescript
import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'

const worker = new Worker('transaction-processing', async (job) => {
  const { client_id, gateway_id, amount, order_id } = job.data
  
  // 1. Get gateway credentials from database
  // 2. Call PSP API (Razorpay/PayU) to create order
  // 3. Update transaction record with gateway_txn_id
  // 4. Return checkout_url
}, {
  connection: { host: process.env.REDIS_HOST },
  concurrency: 25
})
```

#### Service 2: webhook-processor
**Path**: `/workers/webhook-processor/index.ts`

```typescript
const worker = new Worker('webhook-processing', async (job) => {
  const { transaction_id, webhook_data } = job.data
  
  // 1. Update transaction status
  // 2. Calculate commission if status = 'paid'
  // 3. Update wallet_entries and wallets
  // 4. Forward webhook to merchant if configured
}, {
  concurrency: 50,
  attempts: 5
})
```

#### Service 3: whatsapp-sender
**Path**: `/workers/whatsapp-sender/index.ts`

```typescript
const worker = new Worker('whatsapp-notifications', async (job) => {
  const { client_id, template, payload } = job.data
  
  // 1. Get WhatsApp provider token
  // 2. Send notification via API
  // 3. Update whatsapp_notifications table
  // 4. Handle token refresh if needed
}, {
  concurrency: 30,
  attempts: 4
})
```

### Task 4: Gateway Rotation Logic

**File**: `/workers/lib/gateway-selector.ts`

```typescript
export async function selectGateway(supabase, amount: number) {
  // EXACT algorithm:
  // 1. Filter: is_active = true AND temp_failed = false AND current_volume < monthly_limit
  // 2. Sort: priority DESC, success_rate DESC, last_used_at ASC
  // 3. Lock: SELECT ... FOR UPDATE SKIP LOCKED
  // 4. Update: last_used_at = NOW(), current_volume += amount
  // 5. Return gateway or throw SERVICE_UNAVAILABLE
}
```

### Task 5: API Endpoints

Create these exact REST endpoints:

```typescript
// /supabase/functions/api-gateway/index.ts
const routes = {
  'GET /admin/gateways': listGateways,
  'POST /admin/gateways': createGateway,
  'PATCH /admin/gateways/:id': updateGateway,
  'GET /admin/queues': getQueueStats,
  'POST /admin/queues/:action': drainQueue,
  'GET /admin/whatsapp': getWhatsAppLog,
  'GET /merchant/whatsapp/usage': getWAUsage,
  'GET /admin/commission/ledger': getCommissionData
}
```

### Task 6: Environment Variables

**Required for all services:**
```bash
# Supabase
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Redis/BullMQ
REDIS_URL=redis://your_redis_url
BULLMQ_PREFIX=lightspeed

# Workers
MAX_CONCURRENCY_TRANSACTION=25
MAX_CONCURRENCY_WEBHOOK=50
MAX_CONCURRENCY_WHATSAPP=30

# WhatsApp
WA_API_URL=https://your-whatsapp-provider.com/api
WA_API_KEY=your_whatsapp_api_key
WA_TEMPLATE_LOW_BALANCE=low_balance_template
WA_TEMPLATE_TXN_UPDATE=transaction_update_template

# Gateway Credentials (encrypted in database)
ENCRYPTION_KEY=your_32_char_encryption_key
```

### Task 7: Commission System

**File**: `/workers/lib/commission-calculator.ts`

```typescript
export async function calculateCommission(transaction_id: string, amount: number, fee_percent: number) {
  const commission = Math.round(amount * fee_percent / 100)
  
  await supabase.rpc('process_commission', {
    p_transaction_id: transaction_id,
    p_commission: commission
  })
}
```

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION process_commission(
  p_transaction_id UUID,
  p_commission INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Insert commission entry
  INSERT INTO wallet_entries (wallet_id, transaction_id, amount, type)
  SELECT w.id, p_transaction_id, p_commission, 'COMMISSION'
  FROM wallets w
  JOIN transactions t ON t.client_id = w.client_id
  WHERE t.id = p_transaction_id;
  
  -- Update balance
  UPDATE wallets SET balance_due = balance_due + p_commission
  WHERE client_id = (SELECT client_id FROM transactions WHERE id = p_transaction_id);
END;
$$ LANGUAGE plpgsql;
```

### Task 8: Testing Strategy

#### Unit Tests
**Path**: `/workers/tests/`

```typescript
// gateway-selector.test.ts
describe('Gateway Selection', () => {
  it('should select highest priority active gateway', async () => {
    // Test implementation
  })
  
  it('should skip temp_failed gateways', async () => {
    // Test implementation  
  })
})

// commission-calculator.test.ts
describe('Commission Calculation', () => {
  it('should calculate 3.5% commission correctly', async () => {
    // Test implementation
  })
})
```

#### Integration Tests
```typescript
// payment-flow.test.ts  
describe('Payment Flow', () => {
  it('should complete end-to-end payment', async () => {
    // 1. Create test client
    // 2. Call payment-initiate
    // 3. Process transaction
    // 4. Simulate webhook
    // 5. Verify commission
  })
})
```

---

## 🎨 FRONTEND INTEGRATION (PHASE 2 - AFTER BACKEND COMPLETE)

### ⚠️ PREREQUISITE CHECK
Before starting frontend work, verify ALL backend tasks complete:
- [x] All database tables created
- [x] All Edge Functions deployed
- [x] All Railway workers running
- [x] All API endpoints responding
- [x] All tests passing

### Task 9: Update Existing Admin Dashboard

#### New Pages to Add

**Path Structure**:
```
/frontend/src/app/dashboard/
├── admin/
│   ├── gateways/page.tsx          # Gateway management
│   ├── queues/page.tsx            # Queue monitoring  
│   ├── commission/page.tsx        # Commission ledger
│   └── whatsapp/page.tsx          # WhatsApp logs
├── merchant/
│   ├── integration/page.tsx       # Keys & webhook URL
│   └── whatsapp/page.tsx          # WhatsApp usage
└── components/
    ├── GatewayToggle.tsx
    ├── QueueChart.tsx
    ├── CommissionTable.tsx
    └── WhatsAppLog.tsx
```

#### Exact Component Specifications

**GatewayManager** (`/dashboard/admin/gateways/page.tsx`):
```typescript
export default function GatewayManager() {
  const { data: gateways } = useQuery('gateways', fetchGateways)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1>Payment Gateways</h1>
        <Button onClick={() => setShowCreate(true)}>Add Gateway</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gateways?.map(gateway => (
            <TableRow key={gateway.id}>
              <TableCell>{gateway.name}</TableCell>
              <TableCell>{gateway.provider}</TableCell>
              <TableCell>
                <Switch 
                  checked={gateway.is_active}
                  onCheckedChange={(checked) => toggleGateway(gateway.id, checked)}
                />
              </TableCell>
              <TableCell>{gateway.current_volume} / {gateway.monthly_limit}</TableCell>
              <TableCell>{gateway.success_rate}%</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => editGateway(gateway)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

**QueueMonitor** (`/dashboard/admin/queues/page.tsx`):
```typescript
export default function QueueMonitor() {
  const { data: metrics } = useQuery('queue-metrics', fetchQueueMetrics, {
    refetchInterval: 5000
  })
  
  return (
    <div className="space-y-6">
      <h1>Queue Status</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {metrics?.map(queue => (
          <Card key={queue.queue_name}>
            <CardHeader>
              <CardTitle>{queue.queue_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>Waiting: {queue.waiting}</div>
                <div>Active: {queue.active}</div>  
                <div>Failed: {queue.failed}</div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => drainQueue(queue.queue_name)}
                >
                  Drain Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Queue Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <XAxis dataKey="recorded_at" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Line type="monotone" dataKey="waiting" stroke="#8884d8" />
              <Line type="monotone" dataKey="active" stroke="#82ca9d" />
              <Line type="monotone" dataKey="failed" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Task 10: API Integration Hooks

**Path**: `/frontend/src/hooks/api.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const useGateways = () => 
  useQuery(['gateways'], () => 
    fetch('/api/admin/gateways').then(r => r.json())
  )

export const useToggleGateway = () => {
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, active }: { id: string, active: boolean }) =>
      fetch(`/api/admin/gateways/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active })
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['gateways'])
      }
    }
  )
}

export const useQueueMetrics = () =>
  useQuery(['queue-metrics'], 
    () => fetch('/api/admin/queues').then(r => r.json()),
    { refetchInterval: 5000 }
  )

export const useCommissionData = () =>
  useQuery(['commission'], 
    () => fetch('/api/admin/commission/ledger').then(r => r.json())
  )

export const useWhatsAppLog = (page = 1) =>
  useQuery(['whatsapp-log', page], 
    () => fetch(`/api/admin/whatsapp?page=${page}`).then(r => r.json())
  )
```

---

## 📋 AI EXECUTION CHECKLIST

### Phase 1: Backend (MUST COMPLETE ALL)
- [x] **Task 1**: Create all database tables with exact schema
- [x] **Task 2**: Implement payment-initiate Edge Function
- [x] **Task 3**: Implement webhook-handler Edge Function
- [x] **Task 4**: Deploy transaction-processor Railway service
- [x] **Task 5**: Deploy webhook-processor Railway service
- [x] **Task 6**: Deploy whatsapp-sender Railway service
- [x] **Task 7**: Implement gateway rotation logic
- [x] **Task 8**: Create all API endpoints
- [x] **Task 9**: Set up commission calculation system
- [x] **Task 10**: Write and run all tests
- [x] **Task 11**: Deploy and verify all services working

### Phase 2: Frontend (ONLY AFTER PHASE 1 COMPLETE)
- [x] **Task 12**: Update existing dashboard layout
- [x] **Task 13**: Create GatewayManager page
- [x] **Task 14**: Create QueueMonitor page
- [x] **Task 15**: Create CommissionLedger page
- [x] **Task 16**: Create WhatsAppLog page
- [x] **Task 17**: Create IntegrationCenter page
- [x] **Task 18**: Add API integration hooks
- [ ] **Task 19**: Test all frontend functionality

### Phase 3: Final Testing & Deployment
- [x] **Task 20**: End-to-end testing
- [ ] **Task 21**: Production deployment
- [ ] **Task 22**: Monitor and verify all systems

---

## 🔍 SUCCESS CRITERIA

### Backend Verification
```bash
# These commands MUST all work before frontend:
curl -X POST https://api.lightspeedpay.com/payment/initiate \
  -H 'Content-Type: application/json' \
  -d '{"amount":10000,"order_id":"TEST","client_key":"test_key","client_salt":"test_salt"}'

# Should return: {"transaction_id": "uuid", "status": "created"}

curl https://api.lightspeedpay.com/admin/gateways
# Should return: [{"id": "uuid", "name": "gateway_1", ...}]

curl https://api.lightspeedpay.com/admin/queues  
# Should return: [{"queue_name": "transaction-processing", "waiting": 0, ...}]
```

### Frontend Verification  
- Admin can toggle gateways ON/OFF
- Queue metrics update every 5 seconds
- Commission data displays correctly
- WhatsApp logs are paginated and searchable

---

## 🚨 CRITICAL REMINDERS FOR AI

1. **NO FRONTEND WORK** until ALL backend tasks are complete
2. **Use exact file paths** specified in this document
3. **Follow exact database schema** - no modifications
4. **Test each component** before moving to next task
5. **Use provided environment variables** exactly as specified
6. **Implement error handling** for all API calls
7. **Add logging** to all worker processes
8. **Follow TypeScript strict mode** for all code

---

## 📚 REFERENCE LINKS

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- BullMQ Documentation: https://docs.bullmq.io/  
- Railway Deployment: https://docs.railway.app/
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs