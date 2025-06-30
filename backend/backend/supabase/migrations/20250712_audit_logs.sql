-- Audit logging infrastructure added 2025-07-12
-- Enable uuid-ossp extension (safe to run repeatedly)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Audit table capturing critical changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  row_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  actor_id UUID, -- originating auth UID (may be NULL for service operations)
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security – locked down to service_role only
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_service_role" ON audit_logs;
CREATE POLICY "allow_service_role" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Generic audit trigger function
CREATE OR REPLACE FUNCTION record_audit() RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    INSERT INTO audit_logs(table_name,row_id,action,actor_id,new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), v_new);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    INSERT INTO audit_logs(table_name,row_id,action,actor_id,old_data,new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), v_old, v_new);
    RETURN NEW;
  ELSE -- DELETE
    v_old := to_jsonb(OLD);
    INSERT INTO audit_logs(table_name,row_id,action,actor_id,old_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), v_old);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach audit triggers to critical tables (merchants, payment_gateways, transactions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_merchants') THEN
    CREATE TRIGGER audit_merchants
    AFTER INSERT OR UPDATE OR DELETE ON merchants
    FOR EACH ROW EXECUTE FUNCTION record_audit();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_payment_gateways') THEN
    CREATE TRIGGER audit_payment_gateways
    AFTER INSERT OR UPDATE OR DELETE ON payment_gateways
    FOR EACH ROW EXECUTE FUNCTION record_audit();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_transactions') THEN
    CREATE TRIGGER audit_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION record_audit();
  END IF;
END $$; 