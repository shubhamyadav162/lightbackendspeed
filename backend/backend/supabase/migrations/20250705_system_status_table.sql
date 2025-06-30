-- Migration: ensure system_status table exists with unique component constraint and triggers
-- Author: AI assistant – 2025-07-05
-- This migration back-fills the required table for SLA monitoring introduced on 2025-07-05.
-- It is safe to run multiple times thanks to IF NOT EXISTS / IF NOT EXISTS guards.

/* -------------------------------------------------------------------------- */
/* 1. CREATE TABLE                                                             */
/* -------------------------------------------------------------------------- */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.system_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component VARCHAR(255) NOT NULL,            -- e.g., URL or service name
  status VARCHAR(20) NOT NULL,               -- "200", "503", "error"
  response_time_ms INTEGER,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 2. CONSTRAINTS & INDEXES                                                    */
/* -------------------------------------------------------------------------- */
-- Unique constraint so Edge/worker can upsert ON CONFLICT (component)
ALTER TABLE public.system_status
  ADD CONSTRAINT IF NOT EXISTS uq_system_status_component UNIQUE (component);

-- Useful indexes for performance dashboards
CREATE INDEX IF NOT EXISTS idx_system_status_status ON public.system_status(status);
CREATE INDEX IF NOT EXISTS idx_system_status_created_at ON public.system_status(created_at);

/* -------------------------------------------------------------------------- */
/* 3. TRIGGER – auto-update updated_at                                         */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.update_system_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_status_updated ON public.system_status;
CREATE TRIGGER trg_system_status_updated
BEFORE UPDATE ON public.system_status
FOR EACH ROW
EXECUTE FUNCTION public.update_system_status_updated_at();

/* -------------------------------------------------------------------------- */
/* 4. RLS – admin-only (align with other tables)                               */
/* -------------------------------------------------------------------------- */
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin only" ON public.system_status FOR ALL USING ((auth.jwt() ->> 'role') = 'admin'); 