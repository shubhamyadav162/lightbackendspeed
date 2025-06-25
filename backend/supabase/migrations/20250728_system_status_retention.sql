CREATE INDEX IF NOT EXISTS idx_system_status_updated_at ON public.system_status(updated_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_system_status()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.system_status
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$; 