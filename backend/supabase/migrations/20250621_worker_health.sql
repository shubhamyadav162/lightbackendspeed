-- Migration: worker_health heartbeat table
-- Author: AI assistant – 2025-06-21

/* -------------------------------------------------------------------------- */
/* Worker Health Heartbeat Table                                              */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.worker_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_name VARCHAR(100) UNIQUE NOT NULL,
  hostname TEXT,
  pid INTEGER,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* RLS (admin-only, same convention) */
ALTER TABLE public.worker_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin only" ON public.worker_health FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* Index for quick lookup */
CREATE INDEX IF NOT EXISTS idx_worker_health_name ON public.worker_health(worker_name); 