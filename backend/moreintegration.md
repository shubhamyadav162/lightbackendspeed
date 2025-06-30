# LightSpeedPay – Extended Integration Blueprint (Key–Salt Wrapper)

> Version 1.0  |  Last updated 2025-06-20

---

## Table of Contents
1. Context & Goals
2. Backend Expansion
3. Frontend Enhancements
4. Implementation Milestones
5. Appendix
6. AI-Ready Task Checklist
7. WhatsApp Notification System (Low-Balance & Event Alerts)

---

## 1. Context & Goals
LightSpeedPay's **Key–Salt Wrapper** allows merchants without direct Razorpay/PayU accounts to process payments through a single unified interface. This document deep-dives into the extra layers we must add—both **server-side** and **dashboard-side**—so we can support:

1. Per-client pseudo credentials (client_key / client_salt).
2. Dynamic gateway rotation across 20 + upstream accounts.
3. High-volume reliability (2 M tx/day) using **BullMQ** + **Redis**.
4. Fine-grained observability and self-service tooling for merchants & admins.

### 1.1  Aggregator Merchant Model (Business Context)
LightSpeedPay acts as a **technical aggregator** for regulated/high-risk merchants (e.g. online gaming) who cannot obtain a direct payment-gateway account. Onboarding steps:
1. Merchant supplies full KYC to LightSpeedPay.
2. Ops team re-uses that KYC to open *sub-accounts* at multiple upstream PSPs (Razorpay, PayU, etc.)—credentials belong to the merchant, not to LightSpeedPay.
3. Those credentials are stored in `payment_gateways` and routed via the Key–Salt Wrapper & Hosted Checkout described later.

Runtime funds flow:
1. Merchant's app POSTs a payment request to Hosted Checkout.
2. LightSpeedPay selects a PSP credential, creates the order, and returns the checkout page to the customer.
3. PSP settles funds **directly** into the merchant's bank account; LightSpeedPay never holds principal.
4. Upon successful webhook, LightSpeedPay records a **commission entry** in its internal wallet ledger (or uses PSP split-settlement APIs if available).

Result: merchants gain multi-PSP reach and compliance cover; LightSpeedPay earns via per-txn commission while owning the routing & reconciliation logic.

---

## 2. Backend Expansion

### 2.1  High-Level Architecture
```mermaid
flowchart TD
  subgraph API Edge (Supabase Functions)
    A1[POST /payment/initiate] -->|enqueue| Q[(Redis – BullMQ)]
    A2[Razorpay/PayU Webhook \n /webhook/:client_key] -->|enqueue| Q
  end

  subgraph Worker (Railway Node.js)
    Q --> W1[transaction-processor]
    Q --> W2[webhook-relay]
    W1 --> PG[Supabase DB]
    W2 --> PG
    W2 --> C[Client Webhook]
  end

  subgraph Dashboard API
    PG --> REST[Rest API / GraphQL]
  end
```

### 2.2  Domain Models (Postgres)
| Table | Purpose | Key Columns |
|-------|---------|------------|
| `clients` | Stores merchant profile + pseudo creds | `id`, `client_key`, `client_salt`, `webhook_url`, `status` |
| `payment_gateways` | Pool of real Razorpay/PayU creds | `id`, `name`, `api_key`, `api_secret`, `monthly_limit`, `success_rate`, `priority`, `is_active` |
| `transactions` | All payment attempts | `id`, `order_id`, `client_id`, `gateway_id`, `amount`, `status`, `gateway_txn_id`, `created_at` |
| `webhook_events` | Outbound events to merchants | `id`, `transaction_id`, `attempts`, `status`, `next_retry_at` |
| `queue_metrics` | Aggregated BullMQ stats (optional) | `queue_name`, `waiting`, `active`, `completed`, `failed`, `ts` |
| `wallets` | Per-merchant ledger balance | `id`, `balance_due`, `warn_threshold`, `wa_last_sent` |
| `wallet_entries` | Immutable rows: `type = COMMISSION`, `type = COMMISSION_PAYOUT`, reference = `txn_id` | `id`, `amount`, `type`, `transaction_id` |
| `whatsapp_notifications` | Audit log of every attempt | `id`, `client_id`, `template`, `type`, `payload_json`, `status`, `sent_at`, `error`, `created_at` |
| `whatsapp_provider_tokens` | Current auth token + expiry for the Indian WA provider | `id`, `token`, `expiry` |

Row-Level Security (RLS) restricts `clients` & `transactions` by `auth.uid()` for merchant logins; service-role key bypass for workers.

### 2.3  API Surface (Edge Functions)
| Method & Path | Description |
|---------------|------------|
| `POST /payment/initiate` | Verify client Key/Salt → choose gateway → create real order → respond with checkout URL + txn_id |
| `POST /webhook/:client_key` | Receive upstream gateway webhook, verify signature, enqueue for async processing |
| `GET /transaction/:id` | Public status lookup (signed token) |
| `POST /admin/gateway` | CRUD operations for real gateway credentials (admin only) |

All write routes **enqueue** jobs in BullMQ then instantly `200 OK`, improving p99 latency.

### 2.4  Gateway-Rotation Strategy
1. Filter `payment_gateways` where `is_active` = true and `monthly_volume` < `monthly_limit`.
2. Sort by `priority` DESC, then `success_rate` DESC, then `last_used_at` ASC.
3. Lock the row (`SELECT … FOR UPDATE SKIP LOCKED`) to avoid race conditions under load.
4. Update `last_used_at`, increment `current_volume`.
5. Fallback: if no gateway qualifies → raise `SERVICE_UNAVAILABLE` (alert ops).

### 2.5  BullMQ Queues & Workers
| Queue | Producer | Worker | Concurrency | Retries |
|-------|----------|--------|-------------|---------|
| `transaction-processing` | `/payment/initiate` | `transaction-processor.ts` | 25 | 3 × exp backoff |
| `webhook-processing` | `/webhook/:client_key` | `webhook-relay.ts` | 50 | 5 × linear |
| `settlement-processing` | CRON (hourly) | `settlement-processor.ts` | 10 | 2 |
| `whatsapp-notifications` | `balance-checker` cron, `transaction-processor` | `wa-sender.ts` | 30 | 4 × exp backoff |

Environment variables: `REDIS_URL`, `BULLMQ_PREFIX`, `MAX_CONCURRENCY_*`, `WA_API_URL`, `WA_API_KEY`, `WA_TEMPLATE_LOW_BALANCE`, `WA_TEMPLATE_TXN_UPDATE`.

### 2.6  Security Enhancements
- **HMAC** for client Key/Salt verification.
- **JWT** for dashboard/API auth (Supabase Auth).
- **IP allow-listing** for upstream webhook CIDRs.
- **Rate-limiting** on `/payment/initiate` via Supabase Edge limiting middleware.
- **AES-256** encryption for stored gateway secrets (`pgcrypto`).

### 2.7  Observability
- Structured JSON logs (pino) streamed to Railway → Logtail.
- BullMQ events exported to `queue_metrics` via `QueueEvents` listener.
- Grafana dashboards: latency, error %, queue depth, gateway success-rate.
- Alerts routed through Supabase function `failed-transaction-alerts` → Slack/Email.

### 2.8  Deployment Pipeline
1. **Supabase Functions** – push via GitHub Actions → `supabase functions deploy`.
2. **Railway Worker** – Buildpack-deployed Node workers (no Docker). **All workers live as separate *services within the same single Railway account/project***; this yields distinct outbound IPs per service while keeping billing and management centralised.
3. **Migrations** – `supabase db push` gated by branch check.
4. **Redis** – Managed instance on Railway (1 GB tier, 100 connections).

### 2.9  Testing Matrix
- **Unit**: gateway adapter mocks, rotation algorithm.
- **Integration**: worker ↔ Supabase ↔ Redis happy-path & failure.
- **E2E**: Playwright – create txn → pay with Razorpay test card → webhook → status update.
- **Load**: k6 script spiking to 2 k rps for 10 min (dashboard threshold).

### 2.10  Gateway Pool & Toggle Fail-over (Per-Merchant)
- Each merchant can register **up to 50 active gateway credentials** (Razorpay, PayU, Cashfree, etc.) in the `payment_gateways` table.
- Column `is_active` (boolean) drives the **ON/OFF toggle** surfaced in the admin dashboard (`/dashboard/admin/gateways`).
- The rotation selector inside `POST /payment/initiate` must always operate **only on gateways whose toggle is currently ON** (`is_active = true`) and then:
  1. **Filter** gateways where `is_active = true` *and* current `monthly_volume` < `monthly_limit`.
  2. **Order** by `priority DESC`, `success_rate DESC`, `last_used_at ASC`.
  3. **Lock** the chosen row with `SELECT … FOR UPDATE SKIP LOCKED` to avoid double-booking under high concurrency.
  4. **Handle failures**: if the worker receives a 5xx/timeout from the gateway, mark the row `temp_failed = true` (TTL via Redis) and re-queue the job so the selector picks the next provider.
- Toggling a gateway OFF in the UI sets `is_active = false`; the very next payment request will automatically skip that provider, enabling **instant fail-over**.
- Admin UI exposes a **Switch** component bound to the toggle and calls `PATCH /admin/gateway/:id/toggle`.
- All backend logic remains **Docker-less**—Supabase Edge Functions for lightweight compute and Railway-hosted Node workers (deployed via buildpack) for heavy gateway I/O.
- Objective: **zero-downtime rotation across large gateway pools** while giving operators fine-grained control via dashboard toggles.

### 2.11  Merchant On-Boarding & Dashboard Access
- **Internal-Only Dashboard:** The admin UI is restricted to a whitelist of ≈10 internal email accounts managed via Supabase Auth; self-signup is disabled.
- **Merchant Record Creation:** Ops team uses the admin dashboard to create a new row in `clients`; the system auto-generates:
  • `client_key`  
  • `client_salt`  
  • unique webhook endpoint `/webhook/<client_key>`
- **Key Distribution:** These three values are shared with the merchant during onboarding (email / PDF). Merchants never log in to the dashboard.
- **API-Only Interaction:** Merchants integrate by:
  1. Including `client_key` / `client_salt` to sign each `/payment/initiate` call (HMAC).  
  2. Optionally configuring their own server to receive forwarded transaction updates from your webhook relay.
- **Key Rotation:** Admin can click **Regenerate** in the dashboard to issue a new Key/Salt pair; old credentials are invalidated instantly.
- **No Merchant Roles:** Postgres RLS and UI routes have no `merchant` role; future expansion can add it without redesign.

### 2.12  Hosted Checkout Proxy (Dummy Website)
The "dummy" site—our Hosted Checkout—acts as a trusted proxy so the merchant never talks to the upstream gateway directly:

1. **End-to-End Flow**
   1. Client application POSTS to `https://pay.yourdomain.com/initiate` with amount, order_id, client_key, client_salt and optional `redirect_url` / metadata.
   2. Hosted Checkout's API route `/api/checkout/initiate` calls Supabase Edge `POST /payment/initiate`, which picks an eligible gateway via the rotation selector.
   3. Edge enqueues a job into `transaction-processing`; the Railway worker calls the chosen gateway SDK and returns the provider's checkout URL.
   4. Hosted Checkout renders (or redirects) to that checkout URL so the payer completes the payment.
   5. Gateway fires its server-to-server webhook → `/webhook/<client_key>` → worker updates the `transactions` row.
   6. On row update, an Edge Function or SSE push notifies Hosted Checkout (`/status/:txn_id/stream`) which, in turn, forwards the **PAID/FAILED** status back to the browser *and* (if provided) to `redirect_url` on the merchant's server.

2. **Minimising IP Black-Listing Risk**
   a. **Multi-region Edge** – Supabase Functions run on Cloudflare, giving regionally diverse egress IPs.
   b. **Single Railway Project, Multiple Services** – Within the *same* Railway account/project create ≈10 Node worker services (buildpack deploy, no Docker). Each service owns 5 gateway credentials, yielding multiple outbound IPs while keeping ops centralised.
   c. **`temp_failed` flag** – A gateway returning 429/5xx causes the worker to set `temp_failed = true` (stored in Redis with 5-minute TTL). The selector skips these gateways until TTL expires.
   d. **Request-Spread Rule** – Use a per-gateway Redis key `gw:{id}:rpm` (requests per minute) with `INCR` + `EXPIRE 60`. Selector only chooses gateways where `rpm < 1`, guaranteeing at most 1 hit/gateway/minute. Thus 50 requests/min → 50 different gateways.

3. **Dashboard Integration**
   • **Checkout Settings** tab under each merchant: default init URL, rotation mode (round-robin vs smart), "Max RPM per Gateway" (default 1), and toggle for `temp_failed` skip logic.
   • **Gateway Health** table: gateway_id, last_response_code, current RPM and `temp_failed` status.
   • Live log stream (SSE) so operators can watch gateways being skipped or re-enabled in real time.

4. **Security Controls**
   • Only the Hosted Checkout URL is exposed to merchants; API keys never leave your infrastructure.
   • Edge rate-limit of 100 req/min per `client_key` plus reCAPTCHA v3 (score > 0.3) on the checkout form to block bots.

5. **Infra Overview**
   • Supabase Edge Functions: `/payment/initiate`, `/webhook/:client_key`, `/status/:txn_id/stream` (SSE).
   • Railway services: `transaction-processor` workers labelled with `GATEWAY_GROUP=1…10`; all inside the same Railway project.
   • DNS: `pay.yourdomain.com` CNAME → Supabase Edge; Railway worker services are internal-only.

6. **Development Sequence**
   1. Implement Redis RPM counter + selector update.
   2. Add `temp_failed` logic and TTL handling.
   3. Script to spin-up additional Railway services (IaC) within the project.
   4. Build Hosted Checkout SSE listener and `/api/checkout/initiate` route.
   5. Extend Dashboard with *Gateway Health* and *Checkout Settings*.
   6. Playwright E2E: run 50 sequential initiations and assert that each uses a different gateway.

Outcome: every client request travels through a unique (or at least IP-diversified) path, dramatically lowering the chance of any single gateway or IP being rate-limited or black-listed, while the full control loop remains inside the SaaS.

### 2.13  Commission & Settlement
LightSpeedPay earns by charging each merchant a configurable percentage fee on every successful transaction.

1. **Configuration**
   • `merchants.fee_percent` (DECIMAL, e.g. 3.50, 4.00, 5.00).  
   • `merchants.suspend_threshold` – amount of unpaid commission (e.g. ₹10 000) at which the system stops processing new payments.  
   • `wallets` – per-merchant ledger balance (`balance_due`).  
   • `wallet_entries` – immutable rows: `type = COMMISSION` (fee), `type = COMMISSION_PAYOUT` (payout), reference = `txn_id`.

2. **Real-time Fee Calculation**
   When the `transaction-processor` worker writes a **SUCCESS** status it executes, **inside the same DB transaction**:
   ```sql
   fee := amount * fee_percent / 100;
   INSERT INTO wallet_entries (..., amount, type) VALUES (fee, 'COMMISSION');
   UPDATE wallets SET balance_due = balance_due + fee WHERE merchant_id = ...;
   ```
   This guarantees no double counting.

3. **Automatic Suspension Rule**
   At the start of `POST /payment/initiate`, fetch `balance_due`.  
   If `balance_due >= suspend_threshold` → respond `402 Payment Required` with a message to clear dues; otherwise continue.

4. **Collecting the Commission**
   a. **Split-Settlement API** (preferred) – If the PSP supports it, route 96 % to merchant, 4 % to your bank in real time; `wallet_entries` still record the event but `balance_due` stays 0.  
   b. **Auto-Payout Cron** (`collect-commissions`) – Daily at 02:00, call Razorpay Payout / PayU Transfer for merchants whose `balance_due ≥ 1000`; insert negative `COMMISSION_PAYOUT` entry and decrement `balance_due`.  
   c. **Manual Invoice** – Generate PDF at month-end, mark settlement when payment received (`MANUAL_SETTLEMENT`).

5. **Reporting & Audit**
   • View `vw_commission_daily` aggregates volume, fees, payouts per day.  
   • Dashboard tab "Commission Ledger" shows current `balance_due`, last payout date, downloadable invoices.  
   • `wallet_entries` has FK on `transaction_id` and UNIQUE(type, transaction_id) to prevent duplicates.  
   • RLS restricts wallet tables to admin role.

Outcome: A single `fee_percent` field drives per-merchant pricing, fees are logged automatically, processing halts when dues exceed the threshold, and collection can be automated or manual without extra business logic.

### 2.14  Dummy Store Front-End & Customer Authentication
The public-facing "dummy" store (used to convince PSP reviewers) will be a Next.js / Vite app located in the same mono-repo and deployed as another Railway service.

Why **Next.js/Vite** instead of WordPress:
• Same JS/TS stack as Admin & Hosted Checkout – shared tooling, Tailwind, pnpm workspaces.
• Direct call to Supabase Edge (`/api/checkout/initiate`) – no cross-origin hop, end-to-end latency ~150 ms.
• Static Generation (ISR/SSG) gives fast pages and good Lighthouse scores; looks more legitimate to PSP KYC teams.
• One DevOps surface: built with Railway buildpack or Vercel; SSL/CDN auto-managed; no separate PHP hosting.

Directory skeleton:
```
/frontend/dummy-store (Next.js 14 App Router)
  pages/
    index.tsx              # course catalog landing
    course/[slug].tsx      # product details
    auth/login.tsx         # Supabase sign-in form
    auth/register.tsx      # Supabase sign-up form
    api/checkout/initiate  # thin proxy to Supabase Edge
  public/course-images/
```
DNS `courses.yourdomain.com` → this service.

Customer Auth (same Supabase project):
1. Enable public email sign-up (magic-link/OTP).  
2. `users` table has `role` varchar DEFAULT 'customer'; admin accounts are pre-whitelisted with role 'admin'.  
3. RLS: customers can read/update only their own row; admins unrestricted.
4. Dummy store registers/logs-in via Supabase JS SDK; admin dashboard hides sign-up route.

Checkout impact:
• Cart/checkout pages require session; payload includes `customer_id` → stored in `transactions.customer_id` for per-user order history.

Security:
• Auth rate-limit (3 OTP emails per hour/IP), optional reCAPTCHA on sign-up.

Outcome: Reviewers see a fully legitimate e-commerce site with user registration, product pages and secure checkout, all running in the same Supabase database and Railway project without extra infrastructure.

---

## 3. Frontend Enhancements (Command Center)

### 3.1  New Dashboard Sections
| Path | Component | Purpose |
|------|-----------|---------|
| `/dashboard/merchant/integration` | **IntegrationCenter** | Display client_key, client_salt, webhook URL; one-click copy & regenerate |
| `/dashboard/merchant/integration/tester` | **WebhookTester** | Send sample signed events to merchant URL & show delivery log |
| `/dashboard/admin/gateways` | **GatewayManager** | CRUD real gateway creds, set monthly limit/priorities |
| `/dashboard/admin/queues` | **QueueMonitor** | Real-time BullMQ stats (waiting/active/failed) + manual drain/retry |
| `/dashboard/admin/quota` | **QuotaAlerts** | Configure per-client txn caps & alerts |
| `/dashboard/admin/whatsapp` | **WhatsAppLog** | Table, filters, resend button |
| `/dashboard/merchant/whatsapp` | **WhatsAppUsage** | 30-day bar chart |

### 3.2  Shared UI Components
- `KeySaltCard` – masked display + reveal toggle.
- `CopyButton` – generic clipboard helper.
- `StatusPill` – success / warning / danger colour coding.
- `QueueChart` – line + bar combo (Recharts) streaming from `/api/queues`.
- `WhatsAppStatusPill` – success / warning / danger colour coding for WhatsApp notifications.
- `TemplateBadge` – displays the template type of a notification.

### 3.3  Data Hooks (SWR/React-Query)
```tsx
export const useQueues = () => useQuery('queues', () => fetch('/api/queues').then(r=>r.json()), { refetchInterval: 5000 });
export const useGatewayHealth = () => useQuery('gateways', () => fetch('/api/gateways/health').then(r=>r.json()), { refetchInterval: 10000 });
export const useWhatsAppLog = (page = 1) =>
  useQuery(['waLog', page], () => fetch(`/api/whatsapp?page=${page}`).then(r => r.json()));
export const useWhatsAppUsage = () =>
  useQuery('waUsage', () => fetch('/api/merchant/whatsapp/usage').then(r => r.json()), {
    refetchInterval: 60000,
  });
```

### 3.4  UX Flow – Merchant Key/ Salt Regeneration
1. Merchant clicks **Regenerate** on `KeySaltCard`.
2. Modal confirms impact; upon confirm, POST `/api/merchant/keys/regenerate`.
3. Supabase Edge updates record + returns new creds.
4. UI websocket pushes invalidate old creds; show toast with copy buttons.

### 3.5  Accessibility & i18n
- All new pages follow WCAG 2.1 AA.
- Hindi translations added via `next-intl` (`hi-IN.json`).

### 3.6  Dark-Mode & Mobile
- Tailwind `dark:` classes extended to new components.
- Mobile drawers for Integration Center and Queue Monitor.

### 3.7  Front-End ↔ Back-End Alignment Overview
This section ties every planned API to a matching UI element so the whole platform feels consistent and self-service friendly.

1. **Core API Endpoints & Purpose**
| Endpoint | Purpose | Matching UI |
|----------|---------|-------------|
| `POST /payment/initiate` | Start a payment via rotation logic | Checkout button (dummy store) |
| `POST /webhook/:client_key` | Receive PSP webhook | backend only |
| `GET /status/:txn_id/stream` (SSE) | Push live payment status | Dummy-store Order page |
| `GET /admin/gateway` / `PATCH ...` | CRUD + toggle real PSP creds | GatewayManager page |
| `GET /api/queues` / `POST /admin/queues/:action` | BullMQ stats + manual drain/retry | QueueMonitor page |
| `GET /admin/commission/ledger` | Fee & payout ledger | CommissionLedger page |
| `GET /admin/whatsapp?client_id=` | Paginated log for ops | WhatsAppLog page |
| `GET /merchant/whatsapp/usage` | 30-day bar chart | WhatsAppUsage page |

2. **Admin Dashboard Pages (Next.js 14)**
A. **GatewayManager** – table of up to 50 gateways per merchant, ON/OFF toggle, priority edit, live health pill.
B. **QueueMonitor** – line/area charts for waiting/active/failed jobs; drain/retry actions.
C. **CommissionLedger** – volume, fee, balance_due; PDF invoice generator; suspend banner.
D. **CheckoutSettings** – rotation mode, max RPM, temp_failed toggle, dummy-store theme + logo preview (iframe).
E. **AuditLog** – read-only timeline of all admin changes (toggles, fee edits, key regeneration).
F. **GatewayHealth** – optional modal with last_response_code, RPM, temp_failed TTL.
G. **WhatsAppLog** – table, filters, resend button for WhatsApp notifications.
H. **WhatsAppUsage** – 30-day bar chart for notification usage.

3. **Merchant Integration Panel** (read-only)
Displays four copy-buttons generated on merchant creation:
• Client Key
• Client Salt
• Webhook URL `/webhook/<client_key>`
• Dummy-store Checkout URL `https://courses.yourdomain.com/initiate?client_key=...`
Regeneration instantly refreshes all values.

4. **Dummy-Store Pages**
• `/auth/login`, `/auth/register` – Supabase Auth (role = customer).
• `/` catalog, `/course/[slug]` product page.
• `/checkout` – POST to `/api/checkout/initiate`.
• `/order/[txn_id]` – listens to SSE stream until PAID/FAILED.
• `/account/orders` – order history (GET /transaction?customer_id=me).

5. **Shared React Components & Hooks**
ToggleSwitch, StatusPill, CopyButton, MoneyFormatter, useSSE, ProtectedRoute.

6. **Environment & CORS**
Both apps load `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; admin server actions use `SERVICE_ROLE_KEY`.
Supabase Edge CORS allows `courses.yourdomain.com` and `admin.yourdomain.com`.

7. **Roll-Out Order**
1) CommissionLedger API/UI → 2) GatewayManager → 3) QueueMonitor → 4) CheckoutSettings → 5) Dummy-store auth + checkout → 6) AuditLog & polish → 7) WhatsAppLog & WhatsAppUsage.

Outcome: Every backend feature is surfaced in the UI, merchants get clear integration info, ops gets real-time control, and PSP reviewers see a legitimate customer-facing store.

---

## 4. Implementation Milestones
| Week | Backend Deliverables | Frontend Deliverables |
|------|---------------------|-----------------------|
| 1 | DB migrations, tables, RLS | UI skeleton pages + routing |
| 2 | Gateway adapters refactor, rotation algo | Integration Center, KeySaltCard |
| 3 | BullMQ queue definitions, Railway worker | Queue Monitor with live charts |
| 4 | Webhook relay worker, retry logic | Gateway Manager CRUD forms |
| 5 | Load tests, security hardening | Polish UI, i18n, accessibility |

---

## 5. Appendix
- **Sample Curl** to initiate payment:
```bash
curl -X POST https://api.lightspeedpay.com/payment/initiate \
  -H 'X-Client-Key: xyz_client' \
  -H 'X-Client-Salt: abc123' \
  -H 'Content-Type: application/json' \
  -d '{"amount":10000,"order_id":"ORD_123"}'
```

- **Environment Variables Reference**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
BULLMQ_PREFIX=lightspeed
MAX_CONCURRENCY_TRANSACTION=25
```

---

## 6. AI-Ready Task Checklist

> Use this section as a deterministic to-do list that an automated agent (e.g. Cursor AI) can iterate over.  Each point is phrased as an **actionable command** with an expected output.

### 6.1  Backend (Supabase Edge · Railway Workers · Redis)

| # | Action | Suggested Tooling | Output Artifact |
|---|--------|------------------|-----------------|
| 1 | Create Postgres migrations for `clients`, `payment_gateways`, `transactions`, `webhook_events`, `queue_metrics`, `wallets`, `wallet_entries`, `whatsapp_notifications`, `whatsapp_provider_tokens`. | `supabase db diff` → `supabase db push` | `/supabase/migrations/<timestamp>_*` |
| 2 | Scaffold Supabase Edge Function `payment/initiate` with HMAC auth & BullMQ enqueue. | `supabase functions new` | `/supabase/functions/payment-initiate/index.ts` |
| 3 | Scaffold Supabase Edge Function `webhook/[client_key]` for PSP callbacks. | `supabase functions new` | `/supabase/functions/webhook/index.ts` |
| 4 | Implement Node worker `transaction-processor.ts` using `bullmq` + gateway adapters (`src/services/gateways/*`). | `pnpm dlx tsx` for dev | `/supabase-mcp/src/workers/transaction-processor.ts` |
| 5 | Implement Node worker `webhook-relay.ts` to forward events to merchants & update DB. | same as above | `/supabase-mcp/src/workers/webhook-relay.ts` |
| 6 | Add `queue_metrics` listener and Cron `settlement-processor.ts`. | Cron via Railway | `/supabase-mcp/src/workers/settlement-processor.ts` |
| 7 | Write unit tests for rotation algorithm & adapters (`vitest`). | `pnpm test` | `/supabase-mcp/src/tests/*` |
| 8 | Configure GitHub Action CI → lint, test, deploy functions/workers. | `.github/workflows/ci.yml` | Passing workflow |

### 6.2  Frontend (Next.js 14 App Router · Tailwind · React-Query)

| # | Action | Path | Output Artifact |
|---|--------|------|-----------------|
| 1 | Generate admin dashboard skeleton with protected routes. | `/frontend/src/app/dashboard` | Layout + placeholder pages |
| 2 | Build **IntegrationCenter** page with `KeySaltCard`, copy buttons. | `/frontend/src/app/dashboard/merchant/integration` | Ready page |
| 3 | Build **GatewayManager** CRUD table (uses `react-hook-form`, `zod`). | `/frontend/src/app/dashboard/admin/gateways` | Functional page |
| 4 | Build **QueueMonitor** charts using `Recharts` + live fetch hook. | `/frontend/src/app/dashboard/admin/queues` | Functional page |
| 5 | Implement **CommissionLedger** with CSV/PDF export. | `/frontend/src/app/dashboard/admin/commission` | Functional page |
| 6 | Implement i18n (English + Hindi) via `next-intl`; add translations. | `/frontend/src/i18n/*` | `hi-IN.json`, `en.json` |
| 7 | Add dark-mode styles and mobile drawer navigation. | global `tailwind.config.ts` | Responsive UI |
| 8 | E2E tests with Playwright: checkout flow, admin toggles, queue drain. | `/frontend/tests/e2e/*` | Passing tests |

### 6.3  DevOps & Observability

1. **Railway Project:** Provision Redis & multiple Node worker services (`railway run services:create`).
2. **Supabase Project:** Ensure Auth, RLS policies, and Storage are configured (`supabase db reset --linked`).
3. **Monitoring:** Set up Logtail sinks for Supabase Functions and Railway logs. Import dashboards to Grafana.
4. **Alerting:** Wire `failed-transaction-alerts` function to Slack webhook.

### 6.4  Acceptance Criteria

- All CI checks green; migrations idempotent; 95 % unit-test coverage.
- Able to run `pnpm dev:all` locally which spawns Supabase Edge emulator, Redis, workers, and Next.js.
- Playwright E2E passes: 50 sequential payments hit 50 distinct gateways.
- Dashboard reflects live BullMQ stats within 1 s.
- Hindi translations visible when browser `Accept-Language` = `hi-IN`.

---

## 7. WhatsApp Notification System (Low-Balance & Event Alerts)

### 7.1  Backend Blueprint
1. **Database**
   • `whatsapp_notifications` – audit log of every attempt: `id`, `client_id`, `template`, `type` (`LOW_BALANCE`, `TXN_UPDATE`, ...), `payload_json`, `status` (`QUEUED`/`SENT`/`FAILED`), `sent_at`, `error`, `created_at`.
   • `whatsapp_provider_tokens` – current auth token + expiry for the Indian WA provider (only if the provider rotates tokens).

2. **Queues & Workers**
   | Queue | Producer | Worker | Concurrency | Retries |
   |-------|----------|--------|-------------|---------|
   | `whatsapp-notifications` | `balance-checker` cron, `transaction-processor` | `wa-sender.ts` | 30 | 4 × exp backoff |

3. **Low-Balance Watcher**
   • Edge Cron Function `balance-checker` runs every 10 min:  
   `SELECT client_id FROM wallets WHERE balance_due >= warn_threshold AND (wa_last_sent IS NULL OR wa_last_sent < NOW() - INTERVAL '6 hour');`  
   → enqueue `LOW_BALANCE` job.

4. **Sender Worker (`wa-sender.ts`)**
   • Pops jobs, calls provider REST API.  
   • On 401 → refresh token (update `whatsapp_provider_tokens`) → retry.  
   • Writes final status back to `whatsapp_notifications`; emits Pino logs & Prom-counter `wa_sent_total`.

5. **API Surface**
   • `GET /admin/whatsapp?client_id=` – paginated log for ops.  
   • `GET /merchant/whatsapp/usage` – last 30 days count grouped by template.

6. **Observability & Alerts**
   • Grafana: panels for Sent/min, Fail %.  
   • Slack alert if `wa_failed_total / wa_sent_total > 0.05` for 5 min.

7. **Environment Vars**
   `WA_API_URL`, `WA_API_KEY`, `WA_TEMPLATE_LOW_BALANCE`, `WA_TEMPLATE_TXN_UPDATE`.

---

### 7.2  Frontend Additions
| Path | Component | Purpose |
|------|-----------|---------|
| `/dashboard/admin/whatsapp` | **WhatsAppLog** | Table, filters, resend button |
| `/dashboard/merchant/whatsapp` | **WhatsAppUsage** | 30-day bar chart |

Shared UI: `WhatsAppStatusPill`, `TemplateBadge`.

**React Hooks**
```tsx
export const useWhatsAppLog = (page = 1) =>
  useQuery(['waLog', page], () => fetch(`/api/whatsapp?page=${page}`).then(r => r.json()));

export const useWhatsAppUsage = () =>
  useQuery('waUsage', () => fetch('/api/merchant/whatsapp/usage').then(r => r.json()), {
    refetchInterval: 60000,
  });
```

---

### 7.3  AI-Ready Tasks (Append to §6 Checklist)
• Create migration `whatsapp_notifications.sql`.  
• Scaffold Edge Cron `balance-checker`.  
• Implement worker `wa-sender.ts` + tests.  
• Build API routes `/admin/whatsapp`, `/merchant/whatsapp/usage`.  
• Add Grafana panels & Slack alert rule.  
• Build **WhatsAppLog** & **WhatsAppUsage** pages with Playwright tests.

---

**End of Document**