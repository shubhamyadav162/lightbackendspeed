-- Demo Client Gateway Assignments for frontend testing
-- This will enable gateway toggle functionality in ClientGatewayManager

INSERT INTO client_gateway_assignments (
  id,
  client_id, 
  gateway_id, 
  rotation_order, 
  is_active, 
  weight, 
  daily_limit,
  created_at,
  updated_at
) VALUES 
-- Demo Ramlal Client's gateway assignments (8 gateways)
('cga-demo-ramlal-razorpay', 'demo-ramlal-client-2024', 'gw-razorpay-demo', 1, true, 1.0, 200000, NOW(), NOW()),
('cga-demo-ramlal-payu', 'demo-ramlal-client-2024', 'gw-payu-demo', 2, true, 1.0, 120000, NOW(), NOW()),
('cga-demo-ramlal-phonepe', 'demo-ramlal-client-2024', 'gw-phonepe-demo', 3, false, 0.8, 80000, NOW(), NOW()),
('cga-demo-ramlal-paytm', 'demo-ramlal-client-2024', 'gw-paytm-demo', 4, true, 0.9, 150000, NOW(), NOW()),
('cga-demo-ramlal-airtel', 'demo-ramlal-client-2024', 'gw-airtel-demo', 5, false, 0.7, 60000, NOW(), NOW()),
('cga-demo-ramlal-jio', 'demo-ramlal-client-2024', 'gw-jio-demo', 6, true, 0.6, 90000, NOW(), NOW()),
('cga-demo-ramlal-hdfc', 'demo-ramlal-client-2024', 'gw-hdfc-demo', 7, false, 1.2, 300000, NOW(), NOW()),
('cga-demo-ramlal-icici', 'demo-ramlal-client-2024', 'gw-icici-demo', 8, true, 1.1, 250000, NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  weight = EXCLUDED.weight,
  daily_limit = EXCLUDED.daily_limit,
  rotation_order = EXCLUDED.rotation_order,
  updated_at = NOW();

-- Verify the assignments
SELECT 
  cga.id,
  cga.client_id,
  pg.name as gateway_name,
  pg.provider,
  cga.rotation_order,
  cga.is_active,
  cga.weight,
  cga.daily_limit
FROM client_gateway_assignments cga
JOIN payment_gateways pg ON cga.gateway_id = pg.id
WHERE cga.client_id = 'demo-ramlal-client-2024'
ORDER BY cga.rotation_order; 