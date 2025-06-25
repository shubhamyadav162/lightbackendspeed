-- Seed default admin and demo client for LightSpeedPay
-- Note: Uses pgcrypto for password hashing. Run idempotently.

-- Enable pgcrypto for password hashing if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* -------------------------------------------------------------------------- */
/* 1. Insert default admin Supabase user (service account)                    */
/* -------------------------------------------------------------------------- */
-- Supabase Auth users table lives in the "auth" schema. Only run if user not exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@lightspeedpay.io') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'admin',
      'admin@lightspeedpay.io',
      crypt('ChangeMe123!', gen_salt('bf')),
      NOW(),
      jsonb_build_object('role', 'admin', 'name', 'Default Admin'),
      FALSE
    );
  END IF;
END $$;

/* -------------------------------------------------------------------------- */
/* 2. Ensure roles lookup table exists and contains 'admin'                   */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS public.roles (
  name TEXT PRIMARY KEY
);

INSERT INTO public.roles (name)
VALUES ('admin')
ON CONFLICT DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 3. Insert demo merchant/client and wallet                                  */
/* -------------------------------------------------------------------------- */
-- Create demo client row if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE client_key = 'demo_key') THEN
    INSERT INTO public.clients (
      id, client_key, client_salt, company_name, webhook_url,
      fee_percent, suspend_threshold, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000100',
      'demo_key',
      'demo_salt',
      'Demo Merchant',
      'https://example.com/webhook',
      3.50,
      10000,
      'active'
    );
  END IF;
END $$;

-- Create commission wallet for demo client if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.commission_wallets WHERE client_id = '00000000-0000-0000-0000-000000000100'
  ) THEN
    INSERT INTO public.commission_wallets (
      id, client_id, balance_due
    ) VALUES (
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000100',
      0
    );
  END IF;
END $$;

/* -------------------------------------------------------------------------- */
-- End of seed migration 