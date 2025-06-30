-- Migration: 20250725_audit_logs_retention.sql
-- Purpose: Provide housekeeping function and index to purge processed audit logs older than 90 days

/* -------------------------------------------------------------------------- */
/* 1. Performance index                                                      */
/* -------------------------------------------------------------------------- */
-- Ensure index on created_at for efficient range delete (if not exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

/* -------------------------------------------------------------------------- */
/* 2. Housekeeping function                                                  */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete processed audit logs older than 90 days
  DELETE FROM public.audit_logs
  WHERE processed = TRUE
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
-- End of migration                                                            