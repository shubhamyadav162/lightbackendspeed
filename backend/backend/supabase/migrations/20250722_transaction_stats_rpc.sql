CREATE OR REPLACE FUNCTION public.get_transaction_stats()
RETURNS TABLE(total_transactions BIGINT, success_rate NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_transactions,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END AS success_rate
  FROM public.client_transactions;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to allow Edge Functions / anon clients to call via service role
GRANT EXECUTE ON FUNCTION public.get_transaction_stats() TO postgres, anon, authenticated; 