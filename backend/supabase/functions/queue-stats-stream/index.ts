import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Edge Functions: queue-stats-stream
// Streams rows from `queue_metrics` table in real-time using Server-Sent Events (SSE).
// The client can connect via GET /functions/v1/queue-stats-stream and will
// receive JSON-encoded queue metric objects whenever new rows are inserted.
// This is intended for the Real-Time Monitoring dashboard without requiring
// the more expensive realtime subscription on large tables.

Deno.serve(async (req: Request) => {
  // Only allow GET
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Prepare SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Fetch Supabase client from env vars
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(url, anonKey);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to push SSE event
      const send = (data: unknown) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send a ping every 25s to keep connection alive
      const pingInterval = setInterval(() => send({ type: "ping" }), 25_000);

      // Subscribe to queue_metrics inserts
      const channel = supabase
        .channel("queue-metrics-stream")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "queue_metrics" },
          (payload) => {
            send({ type: "metric", data: payload.new });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            send({ type: "ready" });
          }
        });

      // Handle close
      const close = () => {
        clearInterval(pingInterval);
        supabase.removeChannel(channel);
        controller.close();
      };

      // Abort signal from client
      req.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, { headers });
}); 