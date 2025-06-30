-- Migration: commission payout & reporting view
-- Author: AI assistant – 2025-07-07

/* 1. Stored Procedure: process_commission_payout */
CREATE OR REPLACE FUNCTION public.process_commission_payout(
  p_wallet_id UUID,
  p_amount INTEGER
) RETURNS VOID AS $$
DECLARE
  v_wallet commission_wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM public.commission_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  IF p_amount > v_wallet.balance_due THEN
    RAISE EXCEPTION 'AMOUNT_EXCEEDS_BALANCE';
  END IF;

  -- Insert negative payout entry
  INSERT INTO public.commission_entries (wallet_id, transaction_id, amount, type)
  VALUES (p_wallet_id, NULL, -p_amount, 'COMMISSION_PAYOUT');

  -- Decrement balance
  UPDATE public.commission_wallets
  SET balance_due = balance_due - p_amount
  WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql;

/* 2. Reporting View: vw_commission_daily */
CREATE OR REPLACE VIEW public.vw_commission_daily AS
SELECT
  date_trunc('day', ce.created_at) AS day,
  SUM(CASE WHEN ce.type = 'COMMISSION' THEN ce.amount ELSE 0 END) AS total_commission,
  SUM(CASE WHEN ce.type = 'COMMISSION_PAYOUT' THEN -ce.amount ELSE 0 END) AS total_payout,
  SUM(ce.amount) AS net_amount
FROM public.commission_entries ce
GROUP BY 1
ORDER BY 1 DESC; 