-- Migration: create new Phase-2 core tables & extend existing ones
-- Author: AI assistant – 2025-06-20
-- NOTE: All new objects live in the public schema (consistent with current project)
-- Ensure uuid extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* -------------------------------------------------------------------------- */
/* 1. CLIENT MANAGEMENT                                                        */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_key VARCHAR(32) UNIQUE NOT NULL,
  client_salt VARCHAR(64) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500),
  fee_percent DECIMAL(5,2) DEFAULT 3.50,
  suspend_threshold INTEGER DEFAULT 10000,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 2. GATEWAY POOL – extend existing payment_gateways                          */
/* -------------------------------------------------------------------------- */
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 1000000,
  ADD COLUMN IF NOT EXISTS current_volume INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS temp_failed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

/* -------------------------------------------------------------------------- */
/* 3. TRANSACTION PROCESSING (v2 table to avoid conflict with legacy)          */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.client_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  gateway_id UUID REFERENCES public.payment_gateways(id),
  customer_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- in paisa
  status VARCHAR(20) DEFAULT 'created',
  gateway_txn_id VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 4. WEBHOOK EVENTS                                                           */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES public.client_transactions(id),
  attempts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 5. COMMISSION WALLETS & ENTRIES                                             */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.commission_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) UNIQUE,
  balance_due INTEGER DEFAULT 0, -- in paisa
  warn_threshold INTEGER DEFAULT 5000,
  wa_last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commission_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.commission_wallets(id),
  transaction_id UUID REFERENCES public.client_transactions(id),
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'COMMISSION', 'COMMISSION_PAYOUT'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, transaction_id)
);

/* -------------------------------------------------------------------------- */
/* 6. QUEUE METRICS                                                            */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.queue_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name VARCHAR(50) NOT NULL,
  waiting INTEGER DEFAULT 0,
  active INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 7. WHATSAPP NOTIFICATIONS                                                   */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  template VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'LOW_BALANCE', 'TXN_UPDATE'
  payload_json JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_provider_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 8. ROW-LEVEL SECURITY POLICIES (service_role bypasses all)                  */
/* -------------------------------------------------------------------------- */
-- Enable RLS on sensitive tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_wallets ENABLE ROW LEVEL SECURITY;

-- Admin-only access by default (requires 'role' claim)
CREATE POLICY IF NOT EXISTS "Admin only" ON public.clients FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY IF NOT EXISTS "Admin only" ON public.payment_gateways FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY IF NOT EXISTS "Admin only" ON public.client_transactions FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY IF NOT EXISTS "Admin only" ON public.commission_wallets FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

/* -------------------------------------------------------------------------- */
/* 9. TRIGGERS – update updated_at column automatically                       */
/* -------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables with updated_at
CREATE TRIGGER trg_clients_updated
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_payment_gateways_updated
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_client_transactions_updated
BEFORE UPDATE ON public.client_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

/* -------------------------------------------------------------------------- */
/* 10. STORED PROCEDURES                                                      */
/* -------------------------------------------------------------------------- */
-- Commission processing procedure
CREATE OR REPLACE FUNCTION public.process_commission(
  p_transaction_id UUID,
  p_commission INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Insert commission entry
  INSERT INTO public.commission_entries (wallet_id, transaction_id, amount, type)
  SELECT w.id, p_transaction_id, p_commission, 'COMMISSION'
  FROM public.commission_wallets w
  JOIN public.client_transactions t ON t.client_id = w.client_id
  WHERE t.id = p_transaction_id;

  -- Update wallet balance
  UPDATE public.commission_wallets
  SET balance_due = balance_due + p_commission
  WHERE client_id = (SELECT client_id FROM public.client_transactions WHERE id = p_transaction_id);
END;
$$ LANGUAGE plpgsql;

-- Gateway selection query wrapped as a function for atomic lock
CREATE OR REPLACE FUNCTION public.select_gateway_for_amount(p_amount INTEGER)
RETURNS TABLE(id UUID, name TEXT, priority INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH sel AS (
    SELECT *
    FROM public.payment_gateways
    WHERE is_active = TRUE
      AND temp_failed = FALSE
      AND (current_volume + p_amount) < monthly_limit
    ORDER BY priority DESC, success_rate DESC, last_used_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.payment_gateways
  SET last_used_at = NOW(), current_volume = current_volume + p_amount
  FROM sel WHERE payment_gateways.id = sel.id
  RETURNING payment_gateways.id, payment_gateways.name, payment_gateways.priority;
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
-- End of migration                                                          