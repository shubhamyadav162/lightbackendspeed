-- Benchmark script for transaction analytics aggregation
-- Compares Supabase view `transaction_stats` versus raw SQL query executed via pgBouncer pool.
--
-- Usage:
--   psql "$SUPABASE_DB_POOL" -f scripts/benchmark.sql -v merchant_id='<uuid or NULL>' -v days=30
--
-- Parameters (psql -v):
--   merchant_id: UUID string of merchant (or NULL for all merchants)
--   days       : Look-back window in days (1-90). Defaults to 30.
--
-- Results: prints EXPLAIN ANALYZE output for each query so you can compare planning/execution time, buffers, and rows.

\set merchant_id :merchant_id
\set days        :days

\echo '--- Raw SQL aggregation (transactions table) ---'
EXPLAIN (ANALYZE, BUFFERS, FORMAT text)
SELECT
  date_trunc('day', created_at)::date               AS date,
  COUNT(*)                                          AS total_count,
  COUNT(*) FILTER (WHERE status = 'COMPLETED')      AS completed_count,
  COUNT(*) FILTER (WHERE status = 'FAILED')         AS failed_count,
  COUNT(*) FILTER (WHERE status = 'PENDING')        AS pending_count,
  COALESCE(SUM(amount), 0)                          AS total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) AS completed_amount
FROM transactions
WHERE created_at >= NOW() - INTERVAL :'days' || ' day'
  AND (:merchant_id IS NULL OR merchant_id = :merchant_id::uuid)
GROUP BY 1
ORDER BY 1 DESC;

\echo '--- Supabase materialized view (transaction_stats) ---'
EXPLAIN (ANALYZE, BUFFERS, FORMAT text)
SELECT *
FROM transaction_stats
WHERE date >= NOW() - INTERVAL :'days' || ' day'
  AND (:merchant_id IS NULL OR merchant_id = :merchant_id::uuid)
ORDER BY date DESC; 