-- Migration: 20250710_add_indexes_optimization.sql
-- Purpose: Add helpful indexes to improve query performance on frequently
--          queried columns utilised by dashboard analytics.

/* Queue Metrics time-series charts */
CREATE INDEX IF NOT EXISTS idx_queue_metrics_recorded_at ON public.queue_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_queue_metrics_queue_name ON public.queue_metrics(queue_name);

/* Commission Entries listings */
CREATE INDEX IF NOT EXISTS idx_commission_entries_wallet_id ON public.commission_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_created_at ON public.commission_entries(created_at);

/* Webhook Events retry scanning */
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);

DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'next_retry_at'
  ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_webhook_events_next_retry ON public.webhook_events(next_retry_at)';
  END IF;
END $$;

-- End of migration 