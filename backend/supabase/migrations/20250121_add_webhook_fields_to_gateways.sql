-- Migration: Add webhook and extended credential fields to payment_gateways table
-- Purpose: Support webhook URLs, secrets, and additional credential fields for comprehensive gateway configuration
-- Author: AI Assistant - 2025-01-21
-- This migration is idempotent and safe to run multiple times.

/* -------------------------------------------------------------------------- */
/* 1. ADD WEBHOOK AND EXTENDED CREDENTIAL FIELDS                              */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'test',
  ADD COLUMN IF NOT EXISTS channel_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS auth_header TEXT,
  ADD COLUMN IF NOT EXISTS additional_headers JSONB,
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS api_id TEXT;

/* -------------------------------------------------------------------------- */
/* 2. UPDATE EXISTING RECORDS WITH DEFAULT VALUES                             */
/* -------------------------------------------------------------------------- */
UPDATE public.payment_gateways 
SET environment = 'test'
WHERE environment IS NULL;

/* -------------------------------------------------------------------------- */
/* 3. COMMENTS FOR DOCUMENTATION                                               */
/* -------------------------------------------------------------------------- */
COMMENT ON COLUMN public.payment_gateways.webhook_url IS 'Webhook URL where payment gateway will send transaction notifications';
COMMENT ON COLUMN public.payment_gateways.webhook_secret IS 'Secret key for webhook signature verification (encrypted)';
COMMENT ON COLUMN public.payment_gateways.environment IS 'Gateway environment: test, sandbox, or production';
COMMENT ON COLUMN public.payment_gateways.channel_id IS 'Channel ID for providers like Paytm (e.g., WEB, MOBILE)';
COMMENT ON COLUMN public.payment_gateways.auth_header IS 'Additional authentication header for custom gateways';
COMMENT ON COLUMN public.payment_gateways.additional_headers IS 'JSON object containing additional HTTP headers required by gateway';
COMMENT ON COLUMN public.payment_gateways.client_id IS 'Client ID for custom gateway providers';
COMMENT ON COLUMN public.payment_gateways.api_id IS 'API ID for custom gateway providers';

/* -------------------------------------------------------------------------- */
/* 4. CREATE INDEX FOR WEBHOOK QUERIES                                        */
/* -------------------------------------------------------------------------- */
CREATE INDEX IF NOT EXISTS idx_payment_gateways_webhook_url ON public.payment_gateways(webhook_url)
WHERE webhook_url IS NOT NULL;

-- End of migration 