# LightSpeedPay – System Patterns

_Last updated: 2025-07-08_

## Edge Function Streaming Pattern (SSE)

LightSpeedPay uses Supabase Edge Functions to deliver low-latency, cost-effective realtime streams over Server-Sent Events (SSE) instead of opening direct Postgres Realtime subscriptions from the browser.

Pattern characteristics:
1. Edge Function acts as SSE gateway (`Deno.serve`) with event types `ready`, `ping` and domain-specific events (`insert`, `update`).
2. Browser connects via `/functions/v1/<stream>`; React hook manages `EventSource` and parses JSON-encoded payload.
3. Edge Function keeps lightweight Supabase JS client using `anon` key and creates a channel with `postgres_changes` to listen for INSERT/UPDATE on relevant table.
4. Keep-alive `ping` sent every 25 s to avoid idle connection drop.
5. Function is secured by default JWT verification (same as others) – admin dashboard user must be authenticated.

Edge functions following this pattern:
- `queue-stats-stream`
- `gateway-health-stream`
- `transaction-stream`
- `audit-logs-stream`
- `alerts-stream` (NEW)
- `worker-health-stream` (NEW)

This pattern avoids Realtime billing spikes because a single backend listener broadcasts to many connected clients without each opening a DB replication slot.

## Worker Heartbeat & Health Flow

Each worker process sends a heartbeat every 30 s into `worker_health` table (see `worker-health-ping`). The `worker-health-monitor` periodically checks for stale heartbeats and writes critical `alerts` rows and triggers Slack notifications.

Frontend now consumes `worker-health-stream` for live status indicators, while `alerts-stream` powers the Alert Center and toast notifications.

## Housekeeping Worker Pattern (NEW – 2025-07-09)
Housekeeping workers perform time-based cleanup by invoking lightweight RPCs that delete historical data.

Characteristics:
1. RPC encapsulates deletion logic and can be executed in SQL (fast, transactional).
2. Worker runs via BullMQ or Railway cron at off-peak hours (e.g., 03-04 UTC).
3. Worker process is stateless; implementation is <50 LOC using Supabase service-role client.
4. Scheduler may also enqueue cleanup jobs using repeatable cron patterns.

Implemented workers following this pattern:
- `metrics-retention-cleaner` – purges old gateway and queue metrics.
- `alerts-cleaner` – removes resolved alerts >30 days old.
- `audit-logs-cleaner` (NEW) – deletes processed audit logs older than 90 days.

## System Status Monitoring Pattern (NEW – 2025-07-13)

Purpose: Provide administrators with a live overview of key service availability (Payment Processing, API, Database, External Gateways) using lightweight upserts and SSE.

Components:
1. **system-status-checker** Railway worker – runs every 10 min, pings internal and external endpoints, and performs an `upsert` into `public.system_status` table with the latest health metrics (`status`, `response_time_ms`).
2. `public.system_status` table – stores rolling health entries (one per component) with index on `updated_at`; retention RPC `cleanup_old_system_status()` deletes entries older than 30 days (invoked by housekeeping pattern).
3. **system-status-stream** Edge Function – standard SSE wrapper that broadcasts INSERT and UPDATE events from `system_status` table.
4. **useSystemStatusStream** React hook – wraps `EventSource`, merges live rows into local state, and offers a declarative interface for components.
5. **SystemStatus** dashboard widget – merges API polling fallback with SSE stream to display real-time status badges and overall health indicator.

Key Points:
- Follows the existing Edge Function Streaming Pattern (see above) for consistency.
- Upsert strategy keeps only latest row per component, simplifying query logic.
- Retention handled via housekeeping RPC + daily cron. 