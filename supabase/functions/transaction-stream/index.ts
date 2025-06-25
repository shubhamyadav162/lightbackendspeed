// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Edge Function: transaction-stream
// Streams INSERT and UPDATE events from the `transactions` table via Server-Sent Events (SSE).
// Connect using GET /functions/v1/transaction-stream.

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(url, anonKey);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // keep-alive ping every 25 seconds
      const pingInterval = setInterval(() => send({ type: "ping" }), 25_000);

      const channel = supabase
        .channel("transaction-stream")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transactions" },
          (payload) => {
            send({ type: payload.eventType.toLowerCase(), data: payload.new ?? payload.old });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") send({ type: "ready" });
        });

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