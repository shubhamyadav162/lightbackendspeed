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
const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY")!; // For securing the admin gateway

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// BullMQ Queues used by workers
const queues = {
  txn: new Queue("transaction-processing", {
    connection: { url: REDIS_URL },
    prefix: BULLMQ_PREFIX,
  }),
  webhook: new Queue("webhook-processing", {
    connection: { url: REDIS_URL },
    prefix: BULLMQ_PREFIX,
  }),
  wa: new Queue("whatsapp-notifications", {
    connection: { url: REDIS_URL },
    prefix: BULLMQ_PREFIX,
  }),
};

// --- Route Handlers ---

const handlers = {
  // --- Gateway Handlers ---
  listGateways: async () => {
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("*")
      .order("priority", { ascending: false });
    if (error) throw error;
    return data;
  },
  createGateway: async ({ body }) => {
    if (body.api_key) body.api_key = await enc(body.api_key as string);
    if (body.api_secret) body.api_secret = await enc(body.api_secret as string);
    const { data, error } = await supabase
      .from("payment_gateways")
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  updateGateway: async ({ params, body }) => {
    if (body.api_key) body.api_key = await enc(body.api_key as string);
    if (body.api_secret) body.api_secret = await enc(body.api_secret as string);
    const { data, error } = await supabase
      .from("payment_gateways")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  // --- Queue Handlers ---
  getQueueStats: async () => {
    const stats = await Promise.all(
      Object.values(queues).map(async (q) => {
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
  },
  drainQueue: async ({ params }) => {
    const q = queues[params.queueName];
    if (!q) throw new Error("QUEUE_NOT_FOUND");
    if (params.action === "drain") await q.drain();
    if (params.action === "clean") {
      await q.clean(0, 5000, "completed");
      await q.clean(0, 5000, "failed");
    } else {
      throw new Error("Invalid queue action");
    }
    return { ok: true, action: params.action, queue: params.queueName };
  },
  // --- WhatsApp Handlers ---
  getWhatsAppLog: async ({ url }) => {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = 50;
    const { data, error } = await supabase
      .from("whatsapp_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return data;
  },
  getWAUsage: async ({ url }) => {
    const clientId = url.searchParams.get("client_id");
    if (!clientId) throw new Error("client_id query parameter is required");
    const { data, error } = await supabase
      .from("whatsapp_notifications")
      .select("type, count:id")
      .eq("client_id", clientId)
      .group("type");
    if (error) throw error;
    return data;
  },
  // --- Commission Handler ---
  getCommissionData: async () => {
    const { data, error } = await supabase.rpc("get_commission_ledger");
    if (error) {
      console.warn("RPC get_commission_ledger failed, falling back to raw query.", error.message);
      const { data: rawData, error: rawError } = await supabase
        .from("commission_entries")
        .select(
          "id, amount, type, created_at, transaction_id, wallet:wallet_id(client_id, balance_due)"
        )
        .order("created_at", { ascending: false });
      if (rawError) throw rawError;
      return rawData;
    }
    return data;
  },
};

// --- Router ---

const routes = {
  "GET /admin/gateways": handlers.listGateways,
  "POST /admin/gateways": handlers.createGateway,
  "PATCH /admin/gateways/:id": handlers.updateGateway,
  "GET /admin/queues": handlers.getQueueStats,
  "POST /admin/queues/:queueName/:action": handlers.drainQueue,
  "GET /admin/whatsapp": handlers.getWhatsAppLog,
  "GET /merchant/whatsapp/usage": handlers.getWAUsage,
  "GET /admin/commission/ledger": handlers.getCommissionData,
};

function findRoute(method, pathname) {
  for (const route in routes) {
    const [routeMethod, routePath] = route.split(" ");
    if (method !== routeMethod) continue;

    const pathParts = routePath.split("/");
    const urlParts = pathname.split("/");

    if (pathParts.length !== urlParts.length) continue;

    const params = {};
    const isMatch = pathParts.every((part, i) => {
      if (part.startsWith(":")) {
        params[part.substring(1)] = urlParts[i];
        return true;
      }
      return part === urlParts[i];
    });

    if (isMatch) {
      return { handler: routes[route], params };
    }
  }
  return null;
}

// --- Main Server ---

serve(async (req) => {
  // Simple Admin Key Authentication for all routes
  if (req.headers.get("x-api-key") !== ADMIN_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const url = new URL(req.url);
  const routeMatch = findRoute(req.method, url.pathname.replace('/api-gateway', '')); // Adjust for Supabase prefix if needed

  if (!routeMatch) {
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = req.method === "POST" || req.method === "PATCH" ? await req.json() : null;
    const result = await routeMatch.handler({ params: routeMatch.params, body, url });
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("API Gateway Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}); 