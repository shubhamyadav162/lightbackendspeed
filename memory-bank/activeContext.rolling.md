# Active Context – Rolling Window (last updated 2025-06-20)

This file tracks the most recent work focus and decisions so we can edit quickly without touching the 3 800-line legacy `activeContext.md`. Older context remains there for historical reference.

## Recently Completed (DONE)

- 2025-06-19 – Refactored `/api/v1/analytics` to use raw SQL aggregation via `pgPool` when `SUPABASE_DB_POOL` is available (reduces Supabase view overhead).
- 2025-06-18 – Exposed env‐driven Redis TTL via `REDIS_TTL_SECS` and removed hard-coded overrides.
- 2025-06-18 – Added GitHub helper script `scripts/enforce-codecov.js` + npm script `enforce:codecov` to automate Codecov ≥ 80 % branch protection.
- 2025-06-18 – Added Playwright E2E test `analytics-caching.spec.ts` verifying Redis caching behaviour of `/api/v1/analytics`.
- 2025-06-15 – Added Playwright E2E test `wallet-adjustment.spec.ts` covering admin wallet balance adjustment.
- 2025-06-15 – Added Playwright E2E test `settlement-history.spec.ts` validating settlement aggregates & payout logs.
- 2025-06-19 – Added detailed guidance & example for `SUPABASE_DB_POOL` in `env.example` to ease local setup of pgBouncer.
- 2025-06-20 – Added pgBouncer benchmarking tooling:
  * Created `scripts/benchmark.sql` with EXPLAIN ANALYZE for raw SQL vs view.
  * Added `docs/benchmarking.md` instructions for running and automating the benchmark.
- 2025-06-20 – Added Playwright E2E test `analytics-cache-hit.spec.ts` verifying API serves from Redis when cache pre-exists.
- 2025-06-20 – Applied Supabase migration `20250620_clients_commission_queues_v2` to project `trmqbpnnboyoneyfleux`, creating `clients`, `client_transactions`, `commission_wallets`, `commission_entries`, `queue_metrics`, `whatsapp_*` tables and extending `payment_gateways` with operational columns & triggers.
- 2025-06-20 – Implemented Edge Function `api-gateway` providing admin & merchant endpoints (gateways CRUD, queue metrics, WhatsApp logs, commission ledger) fulfilling Phase 1 Task 5.
- 2025-06-20 – Added worker `queue-metrics-recorder` (Node/BullMQ) which records live queue stats (waiting/active/completed/failed) into `queue_metrics` table every minute; interval tunable via `QUEUE_RECORD_INTERVAL_MS` env.
- 2025-06-20 – Added Jest unit test `commission-calculator.test.ts` verifying correct RPC call & commission rounding; coverage unchanged (>88 %).
- 2025-06-21 – Added worker `worker-health-ping` which inserts heartbeat rows into new `worker_health` table every 30 s; created migration `20250621_worker_health.sql`, env var `WORKER_PING_INTERVAL_MS`, and npm script `worker:health-ping`.
- 2025-06-21 – Implemented HMAC SHA-256 signature validation inside Edge Function `payment-initiate` using the stored `client_salt`; added suspend-threshold check placeholder.
- 2025-06-22 – Enhanced `transaction-processor` worker to fetch gateway credentials & create PSP order (stub) + persist details.
- 2025-06-22 – Added helper `createOrder` for Razorpay/PayU stubs.
- 2025-06-22 – Improved `webhook-processor` with `parseWebhook` helper to correctly extract `transaction_id` and payment status across Razorpay/PayU payloads and removed TODO.
- 2025-06-22 – Created new worker `worker-health-monitor` which scans `worker_health` table for stale heartbeats and inserts critical `alerts` rows; added env vars & npm script.

## In Progress

- Extend Analytics tests:
  * ✅ Unit test covers raw-SQL path
  * ✅ Playwright E2E asserts cache hit path (done)
- Final UI build cleanup (font assets, "use client" hydration warnings, dark-mode chart colours).
- 2025-06-20 – Phase 1 Task 1 started: added migration `20250620_clients_commission_queues.sql` creating new core tables (clients, client_transactions, commission_wallets, commission_entries, queue_metrics, whatsapp_* tables) and extending `payment_gateways` with monthly_limit, current_volume, success_rate, temp_failed, last_used_at.
- 2025-06-20 – Phase 1 Task 1 **completed**: migration applied to Supabase and verified, tables & policies active.
- Integrate PSP API calls (Razorpay/PayU) inside `transaction-processor` worker & proper webhook verification logic in `webhook-handler` / `webhook-processor`.
- Implement real PSP API HTTP calls inside `createOrder` helper (requires gateway credentials in DB).
- Implement signature verification logic inside `webhook-handler` Edge Function per provider.
- Build Playwright E2E covering payment flow incl. external PSP redirect stub.

## Upcoming Next Steps

1. Replace expensive Supabase view queries with raw SQL via `pgPool` when available to leverage connection pooling.
2. Extend Playwright analytics flow to assert cache HIT paths (Redis MONITOR), raw SQL path, and chart render hydration on the front-end.
3. Evaluate asset optimization warnings in Next.js build and fix missing fonts.
4. Build alerting mechanism (Edge Function or Worker) that checks `worker_health` for stale heartbeats and inserts rows into `alerts` table and/or sends Slack notifications.

# Misc housekeeping (DONE)
* ✅ CI now runs `scripts/enforce-codecov.js` to enforce Codecov ≥ 80 % branch protection.

Deploy alerting rule (Edge Function or Worker) that queries `