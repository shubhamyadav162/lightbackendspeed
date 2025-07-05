-- Add Girth1Payment gateway configuration
-- Migration: 20250125_add_girth1payment_gateway.sql

INSERT INTO gateways (
  id,
  name,
  provider,
  credentials,
  webhook_url,
  environment,
  is_active,
  priority,
  success_rate,
  average_response_time,
  created_at,
  updated_at
) VALUES (
  '1payment-66465af5-4653-c90f-de1d-6d9f-gateway',
  '🚀 1Payment Gateway',
  'girth1payment',
  '{
    "partner_id": "66465af54653c90fde1d6d9f",
    "project_id": "G46URJ0A3O",
    "api_secret": "84OE8CS7PVI"
  }'::jsonb,
  'https://api.lightspeedpay.in/api/v1/callback/girth1payment',
  'production',
  true,
  3,
  0.0,
  0,
  NOW(),
  NOW()
);

-- Add comment for reference
COMMENT ON TABLE gateways IS 'Payment gateway configurations including Girth1Payment (1Payment) integration';

-- Update gateways table to support girth1payment provider type
ALTER TABLE gateways 
ADD CONSTRAINT check_provider_type 
CHECK (provider IN ('razorpay', 'payu', 'easebuzz', 'girth1payment', 'cashfree', 'paytm', 'phonepe', 'custom'));

-- Create index for faster provider lookups
CREATE INDEX IF NOT EXISTS idx_gateways_provider ON gateways(provider) WHERE is_active = true; 