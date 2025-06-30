import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore – Remote import available at runtime via Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to get env
function getEnv(name: string): string {
  // @ts-ignore – Deno global provided in Edge runtime
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const supabaseAdmin = createClient(
  getEnv("SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
);

export interface SettlementResult {
  settlementId: string;
  amount: number;
}

async function processDueSettlements(): Promise<SettlementResult[]> {
  // Fetch settlements where due_amount > 0 and not deleted
  const { data: settlements, error } = await supabaseAdmin
    .from("merchant_settlements")
    .select("id, merchant_id, due_amount, settled_amount")
    .gt("due_amount", 0)
    .eq("is_deleted", false);

  if (error) throw error;
  if (!settlements || settlements.length === 0) return [];

  const results: SettlementResult[] = [];

  for (const settlement of settlements) {
    const amount: number = settlement.due_amount;

    // Insert payment log row
    const { error: logError } = await supabaseAdmin
      .from("settlement_payment_logs")
      .insert({
        settlement_id: settlement.id,
        amount,
        remark: "Auto settlement payout",
      });

    if (logError) {
      console.error("Failed inserting payment log", logError);
      continue;
    }

    // Update settlement aggregate
    const { error: updateError } = await supabaseAdmin
      .from("merchant_settlements")
      .update({
        settled_amount: (settlement.settled_amount ?? 0) + amount,
        due_amount: 0,
      })
      .eq("id", settlement.id);

    if (updateError) {
      console.error("Failed updating settlement aggregate", updateError);
      continue;
    }

    results.push({ settlementId: settlement.id, amount });
  }

  return results;
}

export const handler = async (_req: Request): Promise<Response> => {
  try {
    const processed = await processDueSettlements();

    return new Response(
      JSON.stringify({ success: true, processed }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("process-settlements error", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

// For Deno unit test
export { processDueSettlements };

// @ts-ignore – Deno global provided in Edge runtime
Deno.serve(handler); 