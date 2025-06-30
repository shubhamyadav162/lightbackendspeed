-- Migration: Add Easebuzz gateway configuration
-- Purpose: Add Easebuzz payment gateway to system with proper credentials
-- Date: 2025-01-22

/* -------------------------------------------------------------------------- */
/* 1. INSERT EASEBUZZ GATEWAY CONFIGURATION                                   */
/* -------------------------------------------------------------------------- */

INSERT INTO public.payment_gateways (
    code,
    name, 
    provider,
    credentials,
    webhook_url,
    environment,
    priority,
    monthly_limit,
    success_rate,
    is_active,
    created_at
) VALUES (
    'easebuzz_primary',
    'Easebuzz Payment Gateway',
    'easebuzz',
    '{
        "api_key": "D4SS5CFXKV",
        "api_secret": "HRQ1A10K7J",
        "webhook_secret": "optional_webhook_secret"
    }'::jsonb,
    'https://api.lightspeedpay.in/api/v1/callback/easebuzzp',
    'test',
    200,
    1000000,
    95.0,
    true,
    NOW()
) ON CONFLICT (code) DO UPDATE SET
    credentials = EXCLUDED.credentials,
    webhook_url = EXCLUDED.webhook_url,
    updated_at = NOW();

/* -------------------------------------------------------------------------- */
/* 2. UPDATE ENVIRONMENT VARIABLES (REFERENCE)                                */
/* -------------------------------------------------------------------------- */

-- Add these to your .env.local:
-- EASEBUZZ_KEY_ID=D4SS5CFXKV  
-- EASEBUZZ_KEY_SECRET=HRQ1A10K7J

-- End of migration 