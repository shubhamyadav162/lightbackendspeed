import { createClient } from '@supabase/supabase-js';

// Worker: SLA Monitor – periodically checks key public endpoints and stores the latency & status in the `system_status` table.
// Environment variables (all optional except SUPABASE_SERVICE_ROLE_KEY):
//  SUPABASE_URL                 – Supabase project URL (required)
//  SUPABASE_SERVICE_ROLE_KEY    – service role key with insert access (required)
//  SLA_MONITOR_INTERVAL_MS      – how often to poll endpoints (default 60000 = 1 min)
//  SLA_MONITOR_ENDPOINTS        – comma-separated list of full URLs to monitor. When omitted we fall back to a sane default set.
//
// The worker performs a basic GET request to every endpoint and measures response time. It then upserts a row in `system_status` keyed by
// the endpoint URL, storing `status` (HTTP status code bucket), `response_time_ms`, and the timestamp. This enables alerts & Grafana
// dashboards to track uptime / latency over time.

/* eslint-disable no-console */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[sla-monitor] SUPABASE_URL / SERVICE_ROLE_KEY env missing');
  process.exit(1);
}

const INTERVAL = Number(process.env.SLA_MONITOR_INTERVAL_MS ?? '60000');

const DEFAULT_ENDPOINTS = [
  `${process.env.PUBLIC_BASE_URL ?? 'https://api.lightspeedpay.com'}/payment/initiate/health`,
  `${process.env.PUBLIC_BASE_URL ?? 'https://api.lightspeedpay.com'}/admin/queues`,
  `${process.env.PUBLIC_BASE_URL ?? 'https://api.lightspeedpay.com'}/admin/gateways`,
];

const endpoints = (process.env.SLA_MONITOR_ENDPOINTS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []) || DEFAULT_ENDPOINTS;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function pingOnce(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const duration = Date.now() - start;
    await supabase.from('system_status').upsert({
      component: url,
      status: String(res.status),
      response_time_ms: duration,
      message: res.ok ? 'OK' : `HTTP_${res.status}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'component' });
    if (!res.ok) {
      console.warn(`[sla-monitor] ${url} responded with status ${res.status}`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    await supabase.from('system_status').upsert({
      component: url,
      status: 'error',
      response_time_ms: duration,
      message: (err as Error).message.slice(0, 255),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'component' });
    console.error(`[sla-monitor] Error pinging ${url}:`, err);
  }
}

async function loop() {
  while (true) {
    await Promise.all(endpoints.map(pingOnce));
    await new Promise((resolve) => setTimeout(resolve, INTERVAL));
  }
}

void loop(); 