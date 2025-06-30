// @ts-nocheck
// Commission Calculator helper (Phase 1 Task 7)
// Calculates commission and calls Supabase RPC.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function calculateCommission(transaction_id: string, amount: number, fee_percent: number) {
  const commission = Math.round((amount * fee_percent) / 100);

  await supabase.rpc("process_commission", {
    p_transaction_id: transaction_id,
    p_commission: commission,
  });
} 