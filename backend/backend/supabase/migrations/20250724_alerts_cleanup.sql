-- Migration: alerts retention cleanup
-- Author: AI assistant – 2025-07-08

/* -------------------------------------------------------------------------- */
/* Function: cleanup_old_alerts                                                */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.cleanup_old_alerts(p_days INTEGER DEFAULT 30)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  DELETE FROM public.alerts
  WHERE is_resolved = true
    AND created_at < NOW() - (p_days || ' days')::interval;
END;
$$;

-- Grant execute to service role & postgres
GRANT EXECUTE ON FUNCTION public.cleanup_old_alerts(integer) TO authenticated, service_role;

/* Index to aid deletion filter */
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at); 