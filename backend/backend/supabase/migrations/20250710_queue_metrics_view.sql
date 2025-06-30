-- Migration: 20250710_queue_metrics_view.sql
-- Purpose: Materialised view aggregating queue_metrics per hour for dashboard
--          charts without heavy GROUP BY scans.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_queue_metrics_hourly AS
SELECT
  queue_name,
  date_trunc('hour', recorded_at) AS hour_bucket,
  AVG(waiting)::INT AS waiting_avg,
  AVG(active)::INT AS active_avg,
  MAX(failed)::INT AS failed_max
FROM public.queue_metrics
GROUP BY queue_name, date_trunc('hour', recorded_at);

/* Index for fast refresh / queries */
CREATE INDEX IF NOT EXISTS idx_vw_qm_hourly_queue ON public.vw_queue_metrics_hourly(queue_name, hour_bucket);

-- End of migration 