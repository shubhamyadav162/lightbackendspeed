-- Migration: add commission ledger RPC & compatibility views
-- Author: AI assistant – 2025-06-23
-- Provides helper RPC for admin dashboard and compat views matching blueprint naming.

/* -------------------------------------------------------------------------- */
/* 1. COMPATIBILITY VIEWS                                                     */
/* -------------------------------------------------------------------------- */
-- View wallets -> commission_wallets
CREATE OR REPLACE VIEW public.wallets AS
SELECT * FROM public.commission_wallets;

-- View wallet_entries -> commission_entries
CREATE OR REPLACE VIEW public.wallet_entries AS
SELECT * FROM public.commission_entries;

/* -------------------------------------------------------------------------- */
/* 2. COMMISSION LEDGER RPC                                                   */
/* -------------------------------------------------------------------------- */
-- Returns a ledger combining commission_entries and their wallet + client info
CREATE OR REPLACE FUNCTION public.get_commission_ledger()
RETURNS TABLE(
  entry_id UUID,
  client_id UUID,
  amount INTEGER,
  type VARCHAR,
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  balance_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ce.id, cw.client_id, ce.amount, ce.type, ce.transaction_id, ce.created_at, cw.balance_due
  FROM public.commission_entries ce
  JOIN public.commission_wallets cw ON cw.id = ce.wallet_id
  ORDER BY ce.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon & authenticated so Edge Function can call via service role
GRANT EXECUTE ON FUNCTION public.get_commission_ledger TO postgres, anon, authenticated; 