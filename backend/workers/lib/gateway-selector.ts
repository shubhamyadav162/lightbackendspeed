import { createClient } from "@supabase/supabase-js";

// Gateway Selector Library (Phase 1 Task 4)
// This file intentionally mirrors `src/lib/gateway-selector.ts` so that worker code
// can import using the exact path specified in the blueprint: `/workers/lib/gateway-selector.ts`.
// The core logic is delegated to the Postgres function `select_gateway_for_amount`
// which performs the algorithm atomically under `FOR UPDATE SKIP LOCKED`.

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function selectGateway(amount: number) {
  const { data, error } = await supabase.rpc("select_gateway_for_amount", { p_amount: amount });
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
} 