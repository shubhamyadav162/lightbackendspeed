-- Migration: 20250718_gateway_metrics_retention.sql
-- Purpose: Store gateway connectivity test results, add performance indexes, and housekeeping function

/* -------------------------------------------------------------------------- */
/* 1. GATEWAY CONNECTIVITY TEST RESULTS                                       */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.gateway_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  latency_ms INTEGER,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/*  Enable RLS – admin-only                                                   */
ALTER TABLE public.gateway_test_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin only" ON public.gateway_test_results;
CREATE POLICY "Admin only" ON public.gateway_test_results
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* -------------------------------------------------------------------------- */
/* 2. PERFORMANCE INDEXES                                                     */
/* -------------------------------------------------------------------------- */
-- Speed up recent metrics queries
CREATE INDEX IF NOT EXISTS idx_gateway_health_metrics_created_at ON public.gateway_health_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_metrics_recorded_at ON public.queue_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_test_results_tested_at ON public.gateway_test_results(tested_at DESC);

/* -------------------------------------------------------------------------- */
/* 3. HOUSEKEEPING FUNCTION – CLEANUP OLD METRICS                             */
/* -------------------------------------------------------------------------- */
-- Deletes metrics older than 30 days to keep tables slim
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.gateway_health_metrics WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM public.queue_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
  DELETE FROM public.gateway_test_results WHERE tested_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
-- End of migration                                                          