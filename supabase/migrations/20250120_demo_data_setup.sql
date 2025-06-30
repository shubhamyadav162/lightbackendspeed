-- Migration: Demo Data Setup for Round-Robin Testing
-- Purpose: Add 5 demo clients with 10 gateways and rotation assignments
-- Author: AI Assistant - 2025-01-20

/* -------------------------------------------------------------------------- */
/* 1. DEMO PAYMENT GATEWAYS                                                   */
/* -------------------------------------------------------------------------- */

-- Insert demo gateways if they don't exist
INSERT INTO public.payment_gateways (id, name, provider, credentials, monthly_limit, current_volume, success_rate, priority, is_active, temp_failed, last_used_at, created_at)
VALUES 
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789001',
    'razorpay_main',
    'razorpay',
    '{"api_key": "rzp_test_1234567890", "api_secret": "encrypted_secret_1", "webhook_secret": "whsec_test1"}',
    2000000,
    150000,
    98.5,
    1,
    true,
    false,
    NOW() - INTERVAL '2 hours',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789002',
    'payu_primary',
    'payu',
    '{"merchant_key": "gtKFFx1234", "salt": "eCwWELxi5678", "auth_header": "test_header"}',
    1500000,
    200000,
    96.8,
    2,
    true,
    false,
    NOW() - INTERVAL '1 hour',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789003',
    'cashfree_backup',
    'cashfree',
    '{"app_id": "94527ccf1a3b1b5bab8b8c", "secret_key": "encrypted_cf_key", "environment": "TEST"}',
    1800000,
    180000,
    97.2,
    3,
    true,
    false,
    NOW() - INTERVAL '30 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789004',
    'paytm_secondary',
    'paytm',
    '{"merchant_id": "PAYTM123456", "merchant_key": "test_paytm_key", "website": "WEBSTAGING", "industry_type": "Retail"}',
    1200000,
    100000,
    95.5,
    4,
    true,
    false,
    NOW() - INTERVAL '15 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789005',
    'phonepe_main',
    'phonepe',
    '{"merchant_id": "PHONEPE789", "salt_key": "phonepe_salt_123", "salt_index": "1", "environment": "UAT"}',
    1600000,
    120000,
    97.8,
    5,
    true,
    false,
    NOW() - INTERVAL '45 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789006',
    'razorpay_backup',
    'razorpay',
    '{"api_key": "rzp_test_backup123", "api_secret": "encrypted_secret_2", "webhook_secret": "whsec_backup"}',
    1000000,
    80000,
    99.1,
    6,
    true,
    false,
    NOW() - INTERVAL '20 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789007',
    'instamojo_primary',
    'custom',
    '{"api_endpoint_url": "https://api.instamojo.com/v2/", "api_key": "test_instamojo_key", "api_secret": "encrypted_instamojo_secret"}',
    800000,
    60000,
    94.3,
    7,
    true,
    false,
    NOW() - INTERVAL '1.5 hours',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789008',
    'ccavenue_main',
    'custom',
    '{"api_endpoint_url": "https://secure.ccavenue.com/", "merchant_id": "CCAV123456", "access_code": "test_access_code", "working_key": "encrypted_working_key"}',
    1300000,
    90000,
    96.0,
    8,
    true,
    false,
    NOW() - INTERVAL '40 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789009',
    'payu_secondary',
    'payu',
    '{"merchant_key": "backup_payu_key", "salt": "backup_payu_salt", "auth_header": "backup_header"}',
    1100000,
    70000,
    95.8,
    9,
    true,
    false,
    NOW() - INTERVAL '25 minutes',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-123456789010',
    'stripe_india',
    'custom',
    '{"api_endpoint_url": "https://api.stripe.com/v1/", "api_key": "sk_test_stripe_india", "webhook_secret": "whsec_stripe_test"}',
    2200000,
    300000,
    98.9,
    10,
    true,
    false,
    NOW() - INTERVAL '10 minutes',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 2. DEMO CLIENTS                                                            */
/* -------------------------------------------------------------------------- */

-- Insert demo clients
INSERT INTO public.clients (id, client_key, client_salt, company_name, webhook_url, fee_percent, suspend_threshold, status, rotation_mode, current_rotation_position, total_assigned_gateways, last_rotation_at, rotation_reset_daily, created_at, updated_at)
VALUES 
  (
    'client-demo-1111-2222-333333333333',
    'LSP_GAMING_PLATFORM_2025',
    'salt_gaming_secure_2025_xyz789',
    'Gaming World India Pvt Ltd',
    'https://api.gamingworld.in/webhook/payment-update',
    3.50,
    15000,
    'active',
    'round_robin',
    2,
    5,
    NOW() - INTERVAL '30 minutes',
    true,
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    'client-demo-2222-3333-444444444444',
    'LSP_ECOMMERCE_STORE_2025',
    'salt_ecom_secure_2025_abc123',
    'ShopKart Online Solutions',
    'https://api.shopkart.com/payments/webhook',
    4.00,
    20000,
    'active',
    'round_robin',
    4,
    6,
    NOW() - INTERVAL '15 minutes',
    true,
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  (
    'client-demo-3333-4444-555555555555',
    'LSP_FINTECH_APP_2025',
    'salt_fintech_secure_2025_def456',
    'MoneyFlow Fintech Ltd',
    'https://webhook.moneyflow.app/payment-events',
    2.80,
    25000,
    'active',
    'round_robin',
    1,
    4,
    NOW() - INTERVAL '5 minutes',
    false,
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    'client-demo-4444-5555-666666666666',
    'LSP_EDUCATION_PORTAL_2025',
    'salt_edu_secure_2025_ghi789',
    'EduTech Learning Platform',
    'https://payments.edutech.in/webhook-handler',
    3.20,
    10000,
    'active',
    'priority',
    3,
    7,
    NOW() - INTERVAL '45 minutes',
    true,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    'client-demo-5555-6666-777777777777',
    'LSP_TRAVEL_BOOKING_2025',
    'salt_travel_secure_2025_jkl012',
    'TravelEasy Booking Services',
    'https://api.traveleasy.co.in/payment-webhook',
    3.80,
    18000,
    'active',
    'smart',
    1,
    3,
    NOW() - INTERVAL '1 hour',
    true,
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 3. CLIENT GATEWAY ASSIGNMENTS                                              */
/* -------------------------------------------------------------------------- */

-- Gaming World India - 5 gateways in round-robin
INSERT INTO public.client_gateway_assignments (id, client_id, gateway_id, rotation_order, is_active, weight, daily_limit, daily_usage, last_used_at, created_at, updated_at)
VALUES 
  ('assign-gaming-1', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, true, 1.0, 800000, 150000, NOW() - INTERVAL '30 minutes', NOW(), NOW()),
  ('assign-gaming-2', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 2, true, 1.0, 800000, 200000, NOW() - INTERVAL '25 minutes', NOW(), NOW()),
  ('assign-gaming-3', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 3, true, 1.0, 800000, 120000, NOW() - INTERVAL '20 minutes', NOW(), NOW()),
  ('assign-gaming-4', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789004', 4, true, 1.0, 800000, 180000, NOW() - INTERVAL '15 minutes', NOW(), NOW()),
  ('assign-gaming-5', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789005', 5, true, 1.0, 800000, 160000, NOW() - INTERVAL '10 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ShopKart Online - 6 gateways
INSERT INTO public.client_gateway_assignments (id, client_id, gateway_id, rotation_order, is_active, weight, daily_limit, daily_usage, last_used_at, created_at, updated_at)
VALUES 
  ('assign-shop-1', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, true, 1.2, 1000000, 180000, NOW() - INTERVAL '35 minutes', NOW(), NOW()),
  ('assign-shop-2', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 2, true, 1.0, 1000000, 220000, NOW() - INTERVAL '30 minutes', NOW(), NOW()),
  ('assign-shop-3', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 3, true, 1.0, 1000000, 140000, NOW() - INTERVAL '25 minutes', NOW(), NOW()),
  ('assign-shop-4', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789006', 4, true, 0.8, 1000000, 160000, NOW() - INTERVAL '20 minutes', NOW(), NOW()),
  ('assign-shop-5', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789007', 5, true, 1.0, 1000000, 100000, NOW() - INTERVAL '15 minutes', NOW(), NOW()),
  ('assign-shop-6', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789008', 6, true, 1.0, 1000000, 190000, NOW() - INTERVAL '10 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- MoneyFlow Fintech - 4 gateways
INSERT INTO public.client_gateway_assignments (id, client_id, gateway_id, rotation_order, is_active, weight, daily_limit, daily_usage, last_used_at, created_at, updated_at)
VALUES 
  ('assign-money-1', 'client-demo-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, true, 1.5, 1200000, 280000, NOW() - INTERVAL '40 minutes', NOW(), NOW()),
  ('assign-money-2', 'client-demo-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 2, true, 1.0, 1200000, 200000, NOW() - INTERVAL '35 minutes', NOW(), NOW()),
  ('assign-money-3', 'client-demo-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-123456789005', 3, true, 1.0, 1200000, 150000, NOW() - INTERVAL '30 minutes', NOW(), NOW()),
  ('assign-money-4', 'client-demo-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-123456789010', 4, true, 1.2, 1200000, 320000, NOW() - INTERVAL '25 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- EduTech Learning - 7 gateways
INSERT INTO public.client_gateway_assignments (id, client_id, gateway_id, rotation_order, is_active, weight, daily_limit, daily_usage, last_used_at, created_at, updated_at)
VALUES 
  ('assign-edu-1', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 1, true, 1.0, 600000, 120000, NOW() - INTERVAL '50 minutes', NOW(), NOW()),
  ('assign-edu-2', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789004', 2, true, 1.0, 600000, 80000, NOW() - INTERVAL '45 minutes', NOW(), NOW()),
  ('assign-edu-3', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789005', 3, true, 1.0, 600000, 140000, NOW() - INTERVAL '40 minutes', NOW(), NOW()),
  ('assign-edu-4', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789006', 4, true, 0.9, 600000, 90000, NOW() - INTERVAL '35 minutes', NOW(), NOW()),
  ('assign-edu-5', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789007', 5, true, 1.0, 600000, 60000, NOW() - INTERVAL '30 minutes', NOW(), NOW()),
  ('assign-edu-6', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789008', 6, true, 1.0, 600000, 110000, NOW() - INTERVAL '25 minutes', NOW(), NOW()),
  ('assign-edu-7', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789009', 7, true, 0.8, 600000, 70000, NOW() - INTERVAL '20 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- TravelEasy Booking - 3 gateways
INSERT INTO public.client_gateway_assignments (id, client_id, gateway_id, rotation_order, is_active, weight, daily_limit, daily_usage, last_used_at, created_at, updated_at)
VALUES 
  ('assign-travel-1', 'client-demo-5555-6666-777777777777', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, true, 1.0, 1500000, 280000, NOW() - INTERVAL '1 hour', NOW(), NOW()),
  ('assign-travel-2', 'client-demo-5555-6666-777777777777', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 2, true, 1.0, 1500000, 240000, NOW() - INTERVAL '55 minutes', NOW(), NOW()),
  ('assign-travel-3', 'client-demo-5555-6666-777777777777', 'a1b2c3d4-e5f6-7890-abcd-123456789010', 3, true, 1.3, 1500000, 380000, NOW() - INTERVAL '50 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 4. COMMISSION WALLETS                                                      */
/* -------------------------------------------------------------------------- */

-- Create commission wallets for demo clients
INSERT INTO public.commission_wallets (id, client_id, balance_due, warn_threshold, wa_last_sent, created_at, updated_at)
VALUES 
  ('wallet-gaming', 'client-demo-1111-2222-333333333333', 8750, 5000, NOW() - INTERVAL '2 hours', NOW(), NOW()),
  ('wallet-shop', 'client-demo-2222-3333-444444444444', 12400, 8000, NOW() - INTERVAL '1 hour', NOW(), NOW()),
  ('wallet-money', 'client-demo-3333-4444-555555555555', 5600, 10000, NULL, NOW(), NOW()),
  ('wallet-edu', 'client-demo-4444-5555-666666666666', 3200, 4000, NOW() - INTERVAL '6 hours', NOW(), NOW()),
  ('wallet-travel', 'client-demo-5555-6666-777777777777', 15200, 7000, NOW() - INTERVAL '30 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 5. DEMO TRANSACTIONS                                                       */
/* -------------------------------------------------------------------------- */

-- Add some demo transactions for analytics
INSERT INTO public.client_transactions (id, order_id, client_id, gateway_id, amount, status, gateway_txn_id, gateway_response, created_at, updated_at)
VALUES 
  ('txn-demo-001', 'ORD_GAMING_001', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 25000, 'success', 'rzp_gaming_001', '{"status": "captured", "amount": 25000}', NOW() - INTERVAL '2 hours', NOW()),
  ('txn-demo-002', 'ORD_GAMING_002', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 15000, 'success', 'payu_gaming_001', '{"status": "success", "amount": 15000}', NOW() - INTERVAL '1.5 hours', NOW()),
  ('txn-demo-003', 'ORD_SHOP_001', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 35000, 'success', 'cf_shop_001', '{"status": "SUCCESS", "amount": 35000}', NOW() - INTERVAL '1 hour', NOW()),
  ('txn-demo-004', 'ORD_MONEY_001', 'client-demo-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 50000, 'success', 'rzp_money_001', '{"status": "captured", "amount": 50000}', NOW() - INTERVAL '45 minutes', NOW()),
  ('txn-demo-005', 'ORD_EDU_001', 'client-demo-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 8000, 'success', 'payu_edu_001', '{"status": "success", "amount": 8000}', NOW() - INTERVAL '30 minutes', NOW()),
  ('txn-demo-006', 'ORD_TRAVEL_001', 'client-demo-5555-6666-777777777777', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 120000, 'success', 'rzp_travel_001', '{"status": "captured", "amount": 120000}', NOW() - INTERVAL '15 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 6. ROTATION METRICS                                                        */
/* -------------------------------------------------------------------------- */

-- Add rotation metrics for the last 7 days
INSERT INTO public.rotation_metrics (id, client_id, gateway_id, rotation_position, transactions_count, total_amount, success_count, failure_count, recorded_date, created_at)
VALUES 
  -- Gaming World - Last 7 days metrics
  ('metric-gaming-1-today', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, 15, 375000, 14, 1, CURRENT_DATE, NOW()),
  ('metric-gaming-2-today', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 2, 18, 270000, 17, 1, CURRENT_DATE, NOW()),
  ('metric-gaming-3-today', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 3, 12, 300000, 12, 0, CURRENT_DATE, NOW()),
  ('metric-gaming-4-today', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789004', 4, 20, 400000, 19, 1, CURRENT_DATE, NOW()),
  ('metric-gaming-5-today', 'client-demo-1111-2222-333333333333', 'a1b2c3d4-e5f6-7890-abcd-123456789005', 5, 16, 320000, 16, 0, CURRENT_DATE, NOW()),
  
  -- ShopKart - Last 7 days metrics  
  ('metric-shop-1-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789001', 1, 25, 625000, 24, 1, CURRENT_DATE, NOW()),
  ('metric-shop-2-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789002', 2, 22, 440000, 21, 1, CURRENT_DATE, NOW()),
  ('metric-shop-3-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789003', 3, 18, 360000, 18, 0, CURRENT_DATE, NOW()),
  ('metric-shop-4-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789006', 4, 21, 420000, 20, 1, CURRENT_DATE, NOW()),
  ('metric-shop-5-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789007', 5, 15, 300000, 14, 1, CURRENT_DATE, NOW()),
  ('metric-shop-6-today', 'client-demo-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-123456789008', 6, 19, 380000, 19, 0, CURRENT_DATE, NOW())
ON CONFLICT (id) DO NOTHING;

-- End of demo data migration 