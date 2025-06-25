-- Migration: API Rate Limiting Tables & Policies (2025-07-15)

-- Table to log API requests for rate-limiting analytics
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role TEXT,
  user_id UUID,
  ip INET,
  route TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index to speed up recent look-ups (e.g., last minute)
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON public.api_request_logs(created_at DESC);

-- RLS: Only admins may view logs; service_role bypasses
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin only" ON public.api_request_logs
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin'); 