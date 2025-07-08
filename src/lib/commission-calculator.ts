// @ts-nocheck
// Commission Calculator helper (Phase 1 Task 7)
// Calculates commission and calls Supabase RPC.

import { getServiceRoleClient } from '../../workers/lib/supabase/service-role';

const supabase = getServiceRoleClient();

export async function calculateCommission(
  transaction_id: string, 
  client_id: string,
  amount: number, 
  fee_percent: number
) {
  // Ensure commission is calculated in the smallest currency unit (paisa)
  const commission = Math.round((amount * fee_percent) / 100);

  const { error } = await supabase.rpc("process_commission", {
    p_transaction_id: transaction_id,
    p_client_id: client_id,
    p_commission: commission,
  });

  if (error) {
    console.error('Error processing commission:', error);
    throw new Error('Failed to process commission via RPC call.');
  }
} 