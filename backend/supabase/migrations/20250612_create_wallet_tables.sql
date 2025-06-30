-- Create customer wallets and wallet transaction tables

-- Enable UUID extension (placeholder safe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core wallet table (one per customer)
CREATE TABLE customer_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) DEFAULT 'INR',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet transactions (ledger)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES customer_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('CREDIT','DEBIT')),
  reason TEXT,
  reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update wallet balance atomically
CREATE OR REPLACE FUNCTION update_wallet_balance() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.type = 'CREDIT') THEN
      UPDATE customer_wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
    ELSE
      UPDATE customer_wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.type = 'CREDIT') THEN
      UPDATE customer_wallets SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
    ELSE
      UPDATE customer_wallets SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_balance_transaction_trigger
AFTER INSERT OR DELETE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Indexes for performance
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);

-- Enable RLS
ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: customers can access their own wallet & transactions
CREATE POLICY "Merchant can view own wallet" ON customer_wallets
  FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Merchant can manage own wallet transactions" ON wallet_transactions
  USING (
    EXISTS (SELECT 1 FROM customer_wallets w WHERE w.id = wallet_id AND w.merchant_id = auth.uid())
  );

-- Service role has full access 