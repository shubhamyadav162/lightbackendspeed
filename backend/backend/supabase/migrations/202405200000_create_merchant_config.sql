CREATE TABLE merchant_config (
  id UUID PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  available_gateways JSONB NOT NULL  -- Array of gateway IDs
); 