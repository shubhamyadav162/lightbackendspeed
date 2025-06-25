-- Migration: 20250711_rls_archived_transactions.sql
-- Purpose: Enable RLS and create policies on archived_transactions table

ALTER TABLE IF EXISTS public.archived_transactions ENABLE ROW LEVEL SECURITY;

-- Admin role full access
DROP POLICY IF EXISTS admin_all_archived_transactions ON public.archived_transactions;
CREATE POLICY admin_all_archived_transactions ON public.archived_transactions
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- Merchant role select only their own transactions
DROP POLICY IF EXISTS merchant_select_own_archived_transactions ON public.archived_transactions;
CREATE POLICY merchant_select_own_archived_transactions ON public.archived_transactions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'merchant' AND
    (client_id = (auth.jwt() ->> 'client_id')::uuid)
  ); 