-- Migration: 20250713_gateway_schema_enhancements.sql
-- Purpose: Add missing 'credentials' column to payment_gateways and introduce
--          gateway_health_metrics table required for real-time health stream.
-- Note   : This migration is idempotent; it uses IF NOT EXISTS guards.

/* -------------------------------------------------------------------------- */
/* 1. PAYMENT GATEWAYS – add credentials column                                */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS credentials JSONB;

COMMENT ON COLUMN public.payment_gateways.credentials IS 'Masked JSON object holding encrypted gateway credentials (api_key, api_secret, additional config)';

/* -------------------------------------------------------------------------- */
/* 2. GATEWAY HEALTH METRICS                                                   */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.gateway_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL,
  latency_ms INTEGER,
  region VARCHAR(50), -- optional region of check (e.g., ap-south-1)
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Helpful indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_ghm_gateway_time ON public.gateway_health_metrics(gateway_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghm_checked_at ON public.gateway_health_metrics(checked_at DESC);

/* -------------------------------------------------------------------------- */
/* 3. ROW LEVEL SECURITY                                                       */
/* -------------------------------------------------------------------------- */
ALTER TABLE public.gateway_health_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only" ON public.gateway_health_metrics;
CREATE POLICY "Admin only" ON public.gateway_health_metrics
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* -------------------------------------------------------------------------- */
-- End of migration 