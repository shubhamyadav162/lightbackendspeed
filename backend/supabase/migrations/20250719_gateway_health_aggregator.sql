-- Migration: 20250719_gateway_health_aggregator.sql
-- Purpose : Provide helper RPC `get_latest_gateway_health` returning latest health metric per gateway.

/* -------------------------------------------------------------------------- */
/* 1. HELPER FUNCTION                                                          */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.get_latest_gateway_health()
RETURNS TABLE(
  gateway_id UUID,
  is_online BOOLEAN,
  latency_ms INTEGER,
  checked_at TIMESTAMPTZ
) AS $$
  SELECT DISTINCT ON (gateway_id)
         gateway_id,
         is_online,
         latency_ms,
         checked_at
  FROM public.gateway_health_metrics
  ORDER BY gateway_id, checked_at DESC;
$$ LANGUAGE sql STABLE;

/* -------------------------------------------------------------------------- */
-- End of migration 