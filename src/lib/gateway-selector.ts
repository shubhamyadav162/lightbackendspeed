// @ts-nocheck
// Gateway Selector (Phase 1 Task 4)
// Implements selection algorithm described in blueprint.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function selectGateway(amount: number) {
  // Strict 1:1 mapping: सिर्फ़ पहला active gateway (priority DESC) चुनो
  const { data: gateways, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  if (!gateways || gateways.length === 0) return null;

  return gateways[0];
} 