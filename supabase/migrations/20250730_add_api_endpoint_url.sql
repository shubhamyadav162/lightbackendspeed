-- Migration: Add API endpoint URL field to payment_gateways table
-- Purpose: Allow custom API endpoint URLs for custom payment gateways like NextGen Techno Ventures
-- Author: AI Assistant - 2025-01-20
-- This migration is idempotent and safe to run multiple times.

/* -------------------------------------------------------------------------- */
/* 1. ADD API ENDPOINT URL COLUMN                                              */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS api_endpoint_url TEXT;

/* -------------------------------------------------------------------------- */
/* 2. UPDATE EXISTING CUSTOM GATEWAYS WITH DEFAULT PLACEHOLDER               */
/* -------------------------------------------------------------------------- */
UPDATE public.payment_gateways 
SET api_endpoint_url = 'https://api.example.com/payment'
WHERE provider = 'custom' 
  AND api_endpoint_url IS NULL;

/* -------------------------------------------------------------------------- */
/* 3. COMMENT                                                                  */
/* -------------------------------------------------------------------------- */
COMMENT ON COLUMN public.payment_gateways.api_endpoint_url IS 'Custom API endpoint URL for payment gateway (required for custom providers)';

-- End of migration 