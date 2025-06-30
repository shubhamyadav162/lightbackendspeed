-- Migration: 20250726_rls_hardening.sql
-- Purpose: Harden authentication & RBAC by enabling RLS and adding admin-only policies on missing tables.
-- Author: AI assistant – 2025-07-10

/* -------------------------------------------------------------------------- */
/* 1. Enable RLS on public.alerts                                             */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only policy (service_role bypasses)
DROP POLICY IF EXISTS "Admin only" ON public.alerts;
CREATE POLICY "Admin only" ON public.alerts
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* -------------------------------------------------------------------------- */
/* 2. Enable RLS on public.whatsapp_provider_tokens                           */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.whatsapp_provider_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only" ON public.whatsapp_provider_tokens;
CREATE POLICY "Admin only" ON public.whatsapp_provider_tokens
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* -------------------------------------------------------------------------- */
/* 3. Helpful indexes for housekeeping                                         */
/* -------------------------------------------------------------------------- */
-- Speed up dashboard queries for latest alerts / tokens
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_expires_at ON public.whatsapp_provider_tokens(expires_at DESC);

/* -------------------------------------------------------------------------- */
-- End of migration                                                           