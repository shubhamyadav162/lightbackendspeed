-- Add sandbox mode support to clients table
ALTER TABLE IF EXISTS public.clients 
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production';

-- Add LightSpeed transaction ID to transactions table
ALTER TABLE IF EXISTS public.transactions 
  ADD COLUMN IF NOT EXISTS lightspeed_txn_id VARCHAR(50) UNIQUE;

-- Update existing clients to have proper environment settings
UPDATE public.clients 
SET environment = CASE 
  WHEN is_sandbox = true THEN 'sandbox' 
  ELSE 'production' 
END;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_environment ON public.clients(environment);
CREATE INDEX IF NOT EXISTS idx_transactions_lightspeed_txn_id ON public.transactions(lightspeed_txn_id); 