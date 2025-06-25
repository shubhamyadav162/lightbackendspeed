// @ts-nocheck
// deno-lint-ignore-file

// Edge Function: api-gateway (Phase 1 Task 5)
// Provides REST endpoints for admin queue/gateway management, WhatsApp logs, and commission ledger.
// Endpoint mapping:
//   GET    /admin/gateways            -> listGateways
//   POST   /admin/gateways            -> createGateway
//   PATCH  /admin/gateways/:id        -> updateGateway
//   GET    /admin/queues              -> getQueueStats
//   POST   /admin/queues/:action      -> drain/clean queue (action=drain|clean)
//   GET    /admin/whatsapp            -> getWhatsAppLog
//   GET    /merchant/whatsapp/usage   -> getWAUsage
//   GET    /admin/commission/ledger   -> getCommissionData
//
// Minimal viable implementation for Phase-1 backend verification.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Queue } from "https://esm.sh/bullmq@3";
import { encrypt as enc } from "../_shared/encryption.ts";

// Environment Variables (set via Supabase secrets)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!;
const BULLMQ_PREFIX = Deno.env.get("BULLMQ_PREFIX") ?? "lightspeed";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// BullMQ Queues used by workers
const txnQueue = new Queue("transaction-processing", {
  connection: { url: REDIS_URL },
  prefix: BULLMQ_PREFIX,
});
const webhookQueue = new Queue("webhook-processing", {
  connection: { url: REDIS_URL },
  prefix: BULLMQ_PREFIX,
});
const waQueue = new Queue("whatsapp-notifications", {
  connection: { url: REDIS_URL },
  prefix: BULLMQ_PREFIX,
});

function matchPath(pathname: string, pattern: RegExp) {
  const m = pathname.match(pattern);
  return m ? m.slice(1) : null;
}

/********************** Gateway CRUD **********************/
async function listGateways() {
  const { data, error } = await supabase
    .from("payment_gateways")
    .select("*")
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function createGateway(body: Record<string, unknown>) {
  if (body.api_key) body.api_key = await enc(body.api_key as string);
  if (body.api_secret) body.api_secret = await enc(body.api_secret as string);
  const { data, error } = await supabase
    .from("payment_gateways")
    .insert(body)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateGateway(id: string, body: Record<string, unknown>) {
  if (body.api_key) body.api_key = await enc(body.api_key as string);
  if (body.api_secret) body.api_secret = await enc(body.api_secret as string);
  const { data, error } = await supabase
    .from("payment_gateways")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/********************** Queue Metrics **********************/
async function getQueueStats() {
  const queues = [txnQueue, webhookQueue, waQueue];
  const stats = await Promise.all(
    queues.map(async (q) => {
      const [waiting, active, failed, completed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getFailedCount(),
        q.getCompletedCount(),
      ]);
      return { queue_name: q.name, waiting, active, completed, failed };
    }),
  );
  return stats;
}

async function drainQueue(queueName: string, action: string) {
  const map: Record<string, Queue> = {
    "transaction-processing": txnQueue,
    "webhook-processing": webhookQueue,
    "whatsapp-notifications": waQueue,
  };
  const q = map[queueName];
  if (!q) throw new Error("QUEUE_NOT_FOUND");
  if (action === "drain") await q.drain();
  if (action === "clean") {
    await q.clean(0, 1000, "completed");
    await q.clean(0, 1000, "failed");
  }
  return { ok: true };
}

/********************** WhatsApp Logs & Usage **********************/
async function getWhatsAppLog(page = 1, pageSize = 50) {
  const { data, error } = await supabase
    .from("whatsapp_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);
  return data;
}

async function getWAUsage(client_id: string) {
  const { data, error } = await supabase
    .from("whatsapp_notifications")
    .select("type, count:id")
    .eq("client_id", client_id)
    .group("type");
  if (error) throw new Error(error.message);
  return data;
}

/********************** Commission Ledger **********************/
async function getCommissionData() {
  // Join commission_entries with wallets + clients
  const { data, error } = await supabase.rpc("get_commission_ledger"); // fallback if RPC exists
  if (error || !data) {
    // fallback to raw join
    const { data: rows, error: err2 } = await supabase
      .from("commission_entries")
      .select(
        "id, amount, type, created_at, transaction_id, wallet:wallet_id(client_id, balance_due)"
      )
      .order("created_at", { ascending: false });
    if (err2) throw new Error(err2.message);
    return rows;
  }
  return data;
}

// Insert helper to derive client_id from JWT payload
function getClientIdFromAuth(authHeader?: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const payloadSegment = token.split(".")[1];
    const padded = payloadSegment.padEnd(payloadSegment.length + (4 - payloadSegment.length % 4) % 4, "=");
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload["client_id"] ?? null;
  } catch (_) {
    return null;
  }
}

/********************** Merchant Integration Details **********************/
async function getIntegrationDetails(client_id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("client_key,client_salt,webhook_url")
    .eq("id", client_id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/********************** Alerts & Summary & System Status **********************/
async function listAlerts(limit = 20) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

async function getAdminSummary() {
  // Total merchants
  const { data: merchantsData, error: merchantsErr, count: merchantCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  if (merchantsErr) throw new Error(merchantsErr.message);

  // Total transactions & success rate
  const { data: txStats, error: txErr } = await supabase.rpc("get_transaction_stats");
  // Fallback if RPC not present
  let total_tx = 0;
  let success_rate = 0;
  if (txErr || !txStats) {
    const { data: txRows, error: txQryErr } = await supabase
      .from("transactions")
      .select("status", { count: "exact" });
    if (txQryErr) throw new Error(txQryErr.message);
    total_tx = txRows.length;
    const success = txRows.filter((t: any) => t.status === "paid").length;
    success_rate = total_tx === 0 ? 0 : Math.round((success / total_tx) * 10000) / 100; // two decimals
  } else if (Array.isArray(txStats) && txStats.length) {
    total_tx = txStats[0].total_transactions ?? 0;
    success_rate = Number(txStats[0].success_rate ?? 0);
  }

  return {
    total_merchants: merchantCount ?? 0,
    total_transactions: total_tx,
    overall_success_rate: success_rate,
  };
}

async function listSystemStatus() {
  const { data, error } = await supabase
    .from("system_status")
    .select("component, uptime, latency_ms, last_checked")
    .order("component", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/********************** Request Router **********************/
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, ""); // trim trailing slash

    // Gateways
    if (pathname === "/admin/gateways" && req.method === "GET") {
      return Response.json(await listGateways());
    }
    if (pathname === "/admin/gateways" && req.method === "POST") {
      return Response.json(await createGateway(await req.json()), { status: 201 });
    }
    const patchGateway = matchPath(pathname, /^\/admin\/gateways\/([\w-]+)$/);
    if (patchGateway && req.method === "PATCH") {
      return Response.json(await updateGateway(patchGateway[0], await req.json()));
    }

    // Queues
    if (pathname === "/admin/queues" && req.method === "GET") {
      return Response.json(await getQueueStats());
    }
    const queueAction = matchPath(pathname, /^\/admin\/queues\/([a-z]+)$/);
    if (queueAction && req.method === "POST") {
      const { queue_name } = await req.json();
      return Response.json(await drainQueue(queue_name, queueAction[0]));
    }

    // WhatsApp logs
    if (pathname === "/admin/whatsapp" && req.method === "GET") {
      const page = Number(url.searchParams.get("page") ?? "1");
      return Response.json(await getWhatsAppLog(page));
    }

    // Commission ledger
    if (pathname === "/admin/commission/ledger" && req.method === "GET") {
      return Response.json(await getCommissionData());
    }

    // Merchant WA Usage
    if (pathname === "/merchant/whatsapp/usage" && req.method === "GET") {
      let client_id = url.searchParams.get("client_id") ?? "";
      if (!client_id) {
        client_id = getClientIdFromAuth(req.headers.get("authorization"));
      }
      if (!client_id) return new Response("client_id required", { status: 400 });
      return Response.json(await getWAUsage(client_id));
    }

    // Merchant Integration details
    if (pathname === "/merchant/integration" && req.method === "GET") {
      let client_id = url.searchParams.get("client_id") ?? "";
      if (!client_id) {
        client_id = getClientIdFromAuth(req.headers.get("authorization"));
      }
      if (!client_id) return new Response("client_id required", { status: 400 });
      return Response.json(await getIntegrationDetails(client_id));
    }

    // Alerts
    if (pathname === "/admin/alerts" && req.method === "GET") {
      const limit = Number(url.searchParams.get("limit") ?? "20");
      return Response.json(await listAlerts(limit));
    }

    // Summary stats for root admin dashboard
    if (pathname === "/admin/summary" && req.method === "GET") {
      return Response.json(await getAdminSummary());
    }

    // System status health
    if (pathname === "/admin/system/status" && req.method === "GET") {
      return Response.json(await listSystemStatus());
    }

    return new Response("Not Found", { status: 404 });
  } catch (err) {
    console.error("[api-gateway]", err);
    return new Response("SERVER_ERROR", { status: 500 });
  }
}); 