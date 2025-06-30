// @ts-nocheck

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Edge Function: audit-logs-stream
// Streams INSERT events from the `audit_logs` table via Server-Sent Events (SSE)
// so the admin dashboard can display live audit activity without polling.
// Connect via GET /functions/v1/audit-logs-stream

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Prepare SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Keep-alive ping every 25 s
      const ping = setInterval(() => send({ type: "ping" }), 25_000);

      // Subscribe to new audit log inserts
      const channel = supabase
        .channel("audit-logs-stream")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "audit_logs" },
          (payload) => {
            send({ type: "log", data: payload.new });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") send({ type: "ready" });
        });

      // Clean-up on connection close
      const close = () => {
        clearInterval(ping);
        supabase.removeChannel(channel);
        controller.close();
      };

      // Abort signal if client closes connection
      req.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, { headers });
}); 