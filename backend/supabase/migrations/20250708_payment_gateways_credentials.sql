-- Migration: add missing credential columns to payment_gateways table to align with blueprint spec
-- Author: AI assistant – 2025-07-08
-- This migration is idempotent and safe to run multiple times.

/* -------------------------------------------------------------------------- */
/* 1. ALTER TABLE – add new columns if they do not yet exist                  */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS api_key TEXT,  -- encrypted via util before insert
  ADD COLUMN IF NOT EXISTS api_secret TEXT;

/* -------------------------------------------------------------------------- */
/* 2. DATA BACKFILL – when provider is NULL but legacy `code` column exists    */
/* -------------------------------------------------------------------------- */
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_gateways' AND column_name='code') THEN
    UPDATE public.payment_gateways
    SET provider = COALESCE(provider, code)
    WHERE provider IS NULL;
  END IF;
END $$;

/* -------------------------------------------------------------------------- */
/* 3. CONSTRAINTS                                                              */
/* -------------------------------------------------------------------------- */
-- Ensure provider is always present going forward
ALTER TABLE IF EXISTS public.payment_gateways
  ALTER COLUMN provider SET NOT NULL;

-- Unique name & provider combo to avoid duplicates (if not already unique)
ALTER TABLE IF EXISTS public.payment_gateways
  ADD CONSTRAINT IF NOT EXISTS uq_payment_gateways_name UNIQUE (name);

/* -------------------------------------------------------------------------- */
/* 4. COMMENT                                                                  */
/* -------------------------------------------------------------------------- */
COMMENT ON COLUMN public.payment_gateways.provider IS 'Gateway provider identifier (e.g., razorpay, payu)';
COMMENT ON COLUMN public.payment_gateways.api_key IS 'Encrypted API key (AES-256-GCM, hex bundle)';
COMMENT ON COLUMN public.payment_gateways.api_secret IS 'Encrypted API secret / salt';

-- End of migration 