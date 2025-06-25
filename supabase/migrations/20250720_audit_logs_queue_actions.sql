-- Migration: 20250720_audit_logs_queue_actions.sql
-- Purpose: Support queue action records in audit_logs and processing flags

/* -------------------------------------------------------------------------- */
/* 1. Expand action enum to include queue operations                          */
/* -------------------------------------------------------------------------- */
/* Drop constraint by known default name first (safe) */
ALTER TABLE IF EXISTS public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- Recreate constraint with additional allowed action strings
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_check CHECK (
    action IN (
      'INSERT', 'UPDATE', 'DELETE', -- existing
      'RETRY', 'CLEAN', 'PAUSE', 'RESUME', 'PRIORITY_UPDATE'
    )
  );

/* -------------------------------------------------------------------------- */
/* 2. Add processed flag for async workers                                    */
/* -------------------------------------------------------------------------- */
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Index to quickly fetch unprocessed queue action entries
CREATE INDEX IF NOT EXISTS idx_audit_logs_processed_action
  ON public.audit_logs (processed, action, created_at DESC);

/* -------------------------------------------------------------------------- */
-- End of migration                                                            