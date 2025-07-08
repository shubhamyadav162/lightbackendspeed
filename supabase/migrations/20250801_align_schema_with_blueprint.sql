-- AI-Generated Migration to align with newfeatureadd.md blueprint
-- Ensures all required tables, columns, and functions exist.

-- 1. Client Management
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key VARCHAR(32) UNIQUE NOT NULL,
  client_salt VARCHAR(64) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500),
  fee_percent DECIMAL(5,2) DEFAULT 3.50,
  suspend_threshold INTEGER DEFAULT 10000,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gateway Pool Management  
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'razorpay_1', 'payu_2'
  provider VARCHAR(50) NOT NULL, -- 'razorpay', 'payu'
  api_key VARCHAR(100) NOT NULL,
  api_secret VARCHAR(100) NOT NULL,
  monthly_limit INTEGER DEFAULT 1000000,
  current_volume INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  temp_failed BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transaction Processing
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(100) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  gateway_id UUID REFERENCES payment_gateways(id),
  customer_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- in paisa
  status VARCHAR(20) DEFAULT 'created',
  gateway_txn_id VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Webhook Management
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  attempts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Commission Tracking
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) UNIQUE,
  balance_due INTEGER DEFAULT 0, -- commission owed in paisa
  warn_threshold INTEGER DEFAULT 5000,
  wa_last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  transaction_id UUID REFERENCES transactions(id),
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'COMMISSION', 'COMMISSION_PAYOUT'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, transaction_id)
);

-- 6. Queue Monitoring
CREATE TABLE IF NOT EXISTS queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(50) NOT NULL,
  waiting INTEGER DEFAULT 0,
  active INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WhatsApp Notifications
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  template VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'LOW_BALANCE', 'TXN_UPDATE'
  payload_json JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_provider_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (idempotent)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin only' AND polrelid = 'public.clients'::regclass) THEN
    CREATE POLICY "Admin only" ON clients FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END;
$$;

ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin only' AND polrelid = 'public.payment_gateways'::regclass) THEN
    CREATE POLICY "Admin only" ON payment_gateways FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END;
$$;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin only' AND polrelid = 'public.transactions'::regclass) THEN
    CREATE POLICY "Admin only" ON transactions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END;
$$;

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin only' AND polrelid = 'public.wallets'::regclass) THEN
    CREATE POLICY "Admin only" ON wallets FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END;
$$;


-- Commission Processing Function
CREATE OR REPLACE FUNCTION process_commission(
  p_transaction_id UUID,
  p_commission INTEGER,
  p_client_id UUID
) RETURNS VOID AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Get wallet_id for the client
  SELECT id INTO v_wallet_id FROM wallets WHERE client_id = p_client_id;

  -- Insert commission entry
  INSERT INTO wallet_entries (wallet_id, transaction_id, amount, type)
  VALUES (v_wallet_id, p_transaction_id, p_commission, 'COMMISSION');
  
  -- Update balance
  UPDATE wallets 
  SET balance_due = balance_due + p_commission
  WHERE id = v_wallet_id;
END;
$$ LANGUAGE plpgsql; 