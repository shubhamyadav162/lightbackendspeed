-- Migration: 20250710_archive_transactions.sql
-- Purpose: Introduce archival table and procedure to move old transactions from
--          client_transactions to archived_transactions for long-term storage.
--          This supports Phase-3 performance optimisation work (table bloat &
--          index size).

/* -------------------------------------------------------------------------- */
/* 1. ARCHIVED TRANSACTIONS TABLE                                             */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.archived_transactions (
  LIKE public.client_transactions INCLUDING ALL
);

-- Ensure primary key constraint remains unique across main & archive tables
ALTER TABLE IF EXISTS public.archived_transactions
  ALTER COLUMN id SET NOT NULL;

-- Optional: indexes for common query paths in analytics exports
CREATE INDEX IF NOT EXISTS idx_archived_txn_client_id ON public.archived_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_archived_txn_created_at ON public.archived_transactions(created_at);

/* -------------------------------------------------------------------------- */
/* 2. STORED PROCEDURE: archive_transactions                                  */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.archive_transactions(p_cutoff TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM public.client_transactions
    WHERE created_at < p_cutoff
    RETURNING *
  )
  INSERT INTO public.archived_transactions SELECT * FROM moved;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Usage Example:
-- SELECT public.archive_transactions(NOW() - INTERVAL '730 days');

/* -------------------------------------------------------------------------- */
-- End of migration                                                           