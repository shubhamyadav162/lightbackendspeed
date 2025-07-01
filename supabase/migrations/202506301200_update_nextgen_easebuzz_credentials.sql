-- Update Easebuzz (NextGen Techno Ventures) production credentials
-- Generated on 2025-06-30

update payment_gateways
set credentials = jsonb_build_object(
    'client_id', '682aefe4e352d264171612c0',
    'api_key',    'FRQT0XKLHY',
    'api_secret', 'S84LOJ3U0N'
  ),
    environment = 'production',
    is_active   = true,
    updated_at  = now()
where id = '2fc79b96-36a3-4a67-ab21-94ce961600b8'; 