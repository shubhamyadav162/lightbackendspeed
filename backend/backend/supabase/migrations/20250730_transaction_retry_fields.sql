-- Migration: 20250730_transaction_retry_fields.sql
-- Adds retry_count and next_retry_at columns to public.transactions table to facilitate retry logic.
-- Author: AI assistant – 2025-07-15

/* -------------------------------------------------------------------------- */
/* Add Columns                                                                 */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

/* -------------------------------------------------------------------------- */
/* Indexes                                                                     */
/* -------------------------------------------------------------------------- */
CREATE INDEX IF NOT EXISTS idx_transactions_next_retry ON public.transactions(next_retry_at);

/* -------------------------------------------------------------------------- */
/* RLS Security Policy remains unchanged (admin only)                          */
/* -------------------------------------------------------------------------- */
 