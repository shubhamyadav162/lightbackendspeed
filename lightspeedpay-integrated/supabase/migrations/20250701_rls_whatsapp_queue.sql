-- Migration: add RLS policies for whatsapp_notifications and queue_metrics tables
-- Author: AI assistant – 2025-07-01

/* -------------------------------------------------------------------------- */
/* Enable Row Level Security                                                   */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.queue_metrics ENABLE ROW LEVEL SECURITY;

/* -------------------------------------------------------------------------- */
/* Admin-only policies                                                         */
/* -------------------------------------------------------------------------- */
CREATE POLICY IF NOT EXISTS "Admin only" ON public.whatsapp_notifications
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admin only" ON public.queue_metrics
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin'); 