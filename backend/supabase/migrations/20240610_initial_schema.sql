-- Migrate existing MongoDB schemas to PostgreSQL
-- Key tables to create:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_salt VARCHAR(255) NOT NULL,
  webhook_url TEXT,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  is_sandbox BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment gateways table
CREATE TABLE payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  credentials JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_id VARCHAR(100) UNIQUE NOT NULL,
  merchant_id UUID REFERENCES merchants(id),
  pg_id UUID REFERENCES payment_gateways(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  pg_response JSONB,
  vpa_id VARCHAR(255),
  is_sandbox BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- CREDIT, DEBIT
  reference_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliates table
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  total_commission_earned DECIMAL(15,2) DEFAULT 0,
  total_commission_disbursed DECIMAL(15,2) DEFAULT 0,
  due_commission DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate merchants relationship table
CREATE TABLE affiliate_merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES affiliates(id),
  merchant_id UUID REFERENCES merchants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(affiliate_id, merchant_id)
);

-- Affiliate commissions table
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES affiliates(id),
  merchant_id UUID REFERENCES merchants(id),
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  url VARCHAR(255) NOT NULL,
  api_id UUID,
  request_details JSONB,
  response_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for multi-tenant security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can access their own data" ON merchants
  FOR ALL
  USING (auth.uid() = id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can access their own transactions" ON transactions
  FOR ALL
  USING (merchant_id = auth.uid());

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can access their own wallets" ON wallets
  FOR ALL
  USING (merchant_id = auth.uid());

-- Create view for transaction analytics
CREATE VIEW transaction_stats AS
SELECT 
  merchant_id,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_count,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) AS completed_amount
FROM transactions
GROUP BY merchant_id, DATE_TRUNC('day', created_at);

-- Triggers for automatic timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchants_timestamp
BEFORE UPDATE ON merchants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_wallets_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 