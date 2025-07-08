-- Create or replace view for transaction analytics
CREATE OR REPLACE VIEW public.transaction_stats AS
SELECT 
  merchant_id,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_count,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) AS completed_amount
FROM public.transactions
GROUP BY merchant_id, DATE_TRUNC('day', created_at); 