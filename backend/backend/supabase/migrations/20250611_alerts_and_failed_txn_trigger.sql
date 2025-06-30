-- Create alerts table and trigger to notify failed transactions via Edge Function

-- Enable http extension (required for http_post)
CREATE EXTENSION IF NOT EXISTS http;

-- Alerts table stores critical system alerts for dashboard consumption
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to POST the failed transaction payload to the Edge Function URL
CREATE OR REPLACE FUNCTION notify_failed_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  response JSON;
  edge_function_url TEXT := 'https://trmqbpnnboyoneyfleux.supabase.co/functions/v1/failed-transaction-alerts';
BEGIN
  -- Only run when status is FAILED; safeguard in case WHEN clause omitted
  IF NEW.status = 'FAILED' THEN
    payload := json_build_object(
      'id', NEW.id,
      'txn_id', NEW.txn_id,
      'merchant_id', NEW.merchant_id,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'status', NEW.status,
      'created_at', NEW.created_at
    );

    -- Make HTTP POST call to Edge Function (non-blocking)
    SELECT content::json INTO response
    FROM http_post(edge_function_url, payload::text, 'application/json');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger executes for INSERT + UPDATE where status becomes FAILED
DROP TRIGGER IF EXISTS trg_notify_failed_txn ON transactions;
CREATE TRIGGER trg_notify_failed_txn
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.status = 'FAILED')
EXECUTE FUNCTION notify_failed_transaction(); 