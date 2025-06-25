/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function checkGatewayHealth() {
  const { data: gateways, error } = await supabase
    .from('payment_gateways')
    .select('id, api_endpoint, is_active');
  if (error) {
    console.error('Error fetching gateways', error);
    return;
  }
  if (!gateways) return;

  for (const gateway of gateways) {
    if (!gateway.is_active) continue;
    const start = Date.now();
    let isAvailable = false;
    try {
      const resp = await fetch(`${gateway.api_endpoint}/ping`, { method: 'GET', timeout: 5000 });
      isAvailable = resp.ok;
    } catch (err) {
      isAvailable = false;
    }
    const latency = Date.now() - start;

    // Insert metric (upsert into gateway_health_metrics)
    const { error: insertErr } = await supabase.from('gateway_health_metrics').insert({
      gateway_id: gateway.id,
      is_online: isAvailable,
      latency_ms: latency,
      checked_at: new Date().toISOString(),
    });
    if (insertErr) {
      console.error('Error inserting metric', insertErr);
    }
  }
}

async function main() {
  while (true) {
    try {
      await checkGatewayHealth();
    } catch (e) {
      console.error('Error in health check loop', e);
    }
    await new Promise((r) => setTimeout(r, 60_000)); // wait 60 seconds
  }
}

main(); 