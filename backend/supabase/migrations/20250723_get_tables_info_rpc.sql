-- Migration: 20250723_get_tables_info_rpc.sql
-- Provides helper RPC to list tables and columns used by internal tools (supabase-mcp).

CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (
  name text,
  schema text,
  columns jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname AS name,
    n.nspname AS schema,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'name', a.attname,
        'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
        'is_nullable', NOT a.attnotnull
      ))
      FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    ) AS columns
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_tables_info() TO anon, authenticated, service_role; 