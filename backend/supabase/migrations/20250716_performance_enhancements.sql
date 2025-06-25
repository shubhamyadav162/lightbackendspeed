-- Migration: 20250716_performance_enhancements.sql
-- Purpose: Additional performance indexes & enable pg_stat_statements for monitoring.

/* Performance extension */
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

/* Transactions filtering & analytics */
CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at ON public.transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_created_at ON public.transactions(merchant_id, created_at DESC);

/* Payment gateway selection */
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active_priority ON public.payment_gateways(is_active, priority);

/* Gateway health dashboard */
CREATE INDEX IF NOT EXISTS idx_gateway_health_gateway_checked_at ON public.gateway_health_metrics(gateway_id, checked_at DESC);

-- End of migration 