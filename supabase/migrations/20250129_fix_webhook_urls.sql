-- Migration: Fix webhook URLs to use correct LightSpeed domain
-- Purpose: Update all webhook URLs from Railway URLs to proper LightSpeed API URLs
-- Date: 2025-01-29

/* -------------------------------------------------------------------------- */
/* UPDATE WEBHOOK URLS FOR ALL GATEWAYS                                      */
/* -------------------------------------------------------------------------- */

-- Update Easebuzz webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/easebuzzp',
  updated_at = NOW()
WHERE provider = 'easebuzz';

-- Update Razorpay webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/razorpay',
  updated_at = NOW()
WHERE provider = 'razorpay';

-- Update PayU webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/payu',
  updated_at = NOW()
WHERE provider = 'payu';

-- Update PhonePe webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/phonepe',
  updated_at = NOW()
WHERE provider = 'phonepe';

-- Update Cashfree webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/cashfree',
  updated_at = NOW()
WHERE provider = 'cashfree';

-- Update Paytm webhook URL
UPDATE public.payment_gateways 
SET 
  webhook_url = 'https://api.lightspeedpay.in/api/v1/callback/paytm',
  updated_at = NOW()
WHERE provider = 'paytm';

-- Update any custom provider webhook URLs that contain Railway URLs
UPDATE public.payment_gateways 
SET 
  webhook_url = REPLACE(webhook_url, 'https://web-production-0b337.up.railway.app/api/v1/callback/', 'https://api.lightspeedpay.in/api/v1/callback/'),
  updated_at = NOW()
WHERE webhook_url LIKE '%web-production-0b337.up.railway.app%';

/* -------------------------------------------------------------------------- */
/* VERIFICATION QUERY (FOR TESTING)                                           */
/* -------------------------------------------------------------------------- */

-- View updated webhook URLs
-- SELECT 
--   id, 
--   name, 
--   provider, 
--   webhook_url, 
--   updated_at 
-- FROM public.payment_gateways 
-- ORDER BY provider, name;

-- End of migration 