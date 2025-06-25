-- Migration: 20250714_gateway_avg_response_time.sql
-- Purpose: Add 'avg_response_time' column to payment_gateways table to support latency insights used by gateway health dashboards.
-- Author: AI assistant – 2025-07-14

/* -------------------------------------------------------------------------- */
/* 1. SCHEMA CHANGE                                                            */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS avg_response_time INTEGER DEFAULT 0;

COMMENT ON COLUMN public.payment_gateways.avg_response_time IS 'Rolling average gateway response time in milliseconds, updated by metrics collector.';

/* -------------------------------------------------------------------------- */
-- End of migration 