-- Migration: 20250710_refresh_mat_view_rpc.sql
-- Purpose: Provide generic function to refresh materialised views via Supabase RPC.

CREATE OR REPLACE FUNCTION public.refresh_materialized_view(p_view_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', p_view_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.refresh_materialized_view(text) TO anon, authenticated, service_role;

-- End of migration 