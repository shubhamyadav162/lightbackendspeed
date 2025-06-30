// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Edge Function: system-status-stream
// Streams INSERT and UPDATE events from public.system_status table via SSE.

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
      const send = (data: unknown) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      send({ type: "ready" });
      const ping = setInterval(() => send({ type: "ping" }), 25_000);

      const channel = supabase
        .channel("system-status-stream")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "system_status" },
          (payload) => send({ type: "insert", data: payload.new }),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "system_status" },
          (payload) => send({ type: "update", data: payload.new }),
        )
        .subscribe();

      const close = () => {
        clearInterval(ping);
        supabase.removeChannel(channel);
        controller.close();
      };

      req.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, { headers });
}); 