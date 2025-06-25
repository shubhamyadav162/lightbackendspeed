// @ts-nocheck
// Gateway Selector (Phase 1 Task 4)
// Implements selection algorithm described in blueprint.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function selectGateway(amount: number) {
  // 1. Filter active gateways
  const { data: gateways, error } = await supabase.rpc("select_gateway_for_amount", { p_amount: amount });

  if (error) throw new Error(error.message);
  if (!gateways || gateways.length === 0) return null;

  return gateways[0];
} 