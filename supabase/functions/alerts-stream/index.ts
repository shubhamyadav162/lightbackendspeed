import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Edge Function: alerts-stream
// Streams rows from `alerts` table via Server-Sent Events (SSE).
// Emits an event whenever a new alert is inserted or updated (is_resolved status change).

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(url, anonKey);

  const stream = new ReadableStream({
    async start(controller) {
      // helper
      const send = (data: unknown) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // initial ping
      send({ type: "ready" });

      const pingInterval = setInterval(() => send({ type: "ping" }), 25_000);

      // subscribe to INSERT & UPDATE on alerts table
      const channel = supabase
        .channel("alerts-stream")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alerts" },
          (payload) => {
            send({ type: "insert", data: payload.new });
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "alerts" },
          (payload) => {
            send({ type: "update", data: payload.new });
          },
        )
        .subscribe();

      const close = () => {
        clearInterval(pingInterval);
        supabase.removeChannel(channel);
        controller.close();
      };

      req.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, { headers });
}); 