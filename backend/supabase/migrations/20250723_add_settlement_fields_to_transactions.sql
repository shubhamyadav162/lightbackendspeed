-- Migration: 20250723_add_settlement_fields_to_transactions.sql
-- Adds settlement_id and settlement_date columns to transactions table for settlement tracking.

ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.settlement_payment_logs(id),
  ADD COLUMN IF NOT EXISTS settlement_date TIMESTAMP WITH TIME ZONE;

-- Grant permissions
GRANT SELECT, UPDATE ON public.transactions TO anon, authenticated, service_role; 