-- Migration: Round-Robin Gateway Rotation System
-- Purpose: Add merchant-specific round-robin rotation for even distribution
-- Author: AI Assistant - 2025-01-20

/* -------------------------------------------------------------------------- */
/* 1. MERCHANT GATEWAY ROTATION TRACKING                                       */
/* -------------------------------------------------------------------------- */

-- Add rotation fields to clients table
ALTER TABLE IF EXISTS public.clients
  ADD COLUMN IF NOT EXISTS rotation_mode VARCHAR(20) DEFAULT 'round_robin', -- 'round_robin', 'priority', 'smart'
  ADD COLUMN IF NOT EXISTS current_rotation_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_assigned_gateways INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rotation_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS rotation_reset_daily BOOLEAN DEFAULT true;

-- Add rotation fields to payment_gateways table  
ALTER TABLE IF EXISTS public.payment_gateways
  ADD COLUMN IF NOT EXISTS rotation_order INTEGER DEFAULT 0, -- Position in rotation for each merchant
  ADD COLUMN IF NOT EXISTS usage_count_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rotation_reset TIMESTAMPTZ DEFAULT NOW();

/* -------------------------------------------------------------------------- */
/* 2. CLIENT-GATEWAY ASSIGNMENT TABLE                                          */
/* -------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS public.client_gateway_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL, -- 1, 2, 3, ..., 20 for this client
  is_active BOOLEAN DEFAULT true,
  weight DECIMAL(3,2) DEFAULT 1.00, -- For weighted round-robin (1.0 = normal, 2.0 = double weight)
  daily_limit INTEGER DEFAULT 1000000, -- Daily transaction limit for this client-gateway combo
  daily_usage INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, gateway_id),
  UNIQUE(client_id, rotation_order)
);

-- Index for fast rotation queries
CREATE INDEX IF NOT EXISTS idx_client_gateway_rotation ON public.client_gateway_assignments(client_id, rotation_order, is_active);
CREATE INDEX IF NOT EXISTS idx_gateway_daily_usage ON public.client_gateway_assignments(gateway_id, daily_usage);

/* -------------------------------------------------------------------------- */
/* 3. ROTATION METRICS TABLE                                                   */
/* -------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS public.rotation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  rotation_position INTEGER NOT NULL,
  transactions_count INTEGER DEFAULT 0,
  total_amount BIGINT DEFAULT 0, -- in paisa
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  recorded_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, gateway_id, recorded_date)
);

-- Index for daily metrics aggregation
CREATE INDEX IF NOT EXISTS idx_rotation_metrics_date ON public.rotation_metrics(recorded_date, client_id);

/* -------------------------------------------------------------------------- */
/* 4. ENHANCED ROUND-ROBIN SELECTION FUNCTION                                  */
/* -------------------------------------------------------------------------- */

-- Drop old function and create enhanced version
DROP FUNCTION IF EXISTS public.select_gateway_for_amount(INTEGER);

CREATE OR REPLACE FUNCTION public.select_gateway_for_client_round_robin(
  p_client_id UUID,
  p_amount INTEGER
) RETURNS TABLE(
  gateway_id UUID, 
  gateway_name TEXT, 
  provider TEXT,
  rotation_position INTEGER,
  next_position INTEGER
) AS $$
  DECLARE
    current_position INTEGER;
    next_position INTEGER;
    total_gateways INTEGER;
    selected_assignment RECORD;
  BEGIN
    -- Get client's current rotation position and mode
    SELECT current_rotation_position, total_assigned_gateways
    INTO current_position, total_gateways
    FROM public.clients 
    WHERE id = p_client_id;
  
      -- If no gateways assigned, return empty
    IF total_gateways = 0 THEN
      RETURN;
    END IF;
    
    -- Calculate next rotation position (round-robin: 1,2,3...20,1,2,3...)
    next_position := (current_position % total_gateways) + 1;
  
  -- Find the gateway at next rotation position
  SELECT cga.*, pg.name, pg.provider
  INTO selected_assignment
  FROM public.client_gateway_assignments cga
  JOIN public.payment_gateways pg ON pg.id = cga.gateway_id
  WHERE cga.client_id = p_client_id 
    AND cga.rotation_order = next_position
    AND cga.is_active = true
    AND pg.is_active = true
    AND pg.temp_failed = false
    AND (cga.daily_usage + p_amount) <= cga.daily_limit
    AND (pg.current_volume + p_amount) <= pg.monthly_limit
  FOR UPDATE SKIP LOCKED;
  
  -- If selected gateway is not available, find next available in sequence
  IF selected_assignment IS NULL THEN
    SELECT cga.*, pg.name, pg.provider
    INTO selected_assignment
    FROM public.client_gateway_assignments cga
    JOIN public.payment_gateways pg ON pg.id = cga.gateway_id
    WHERE cga.client_id = p_client_id 
      AND cga.is_active = true
      AND pg.is_active = true
      AND pg.temp_failed = false
      AND (cga.daily_usage + p_amount) <= cga.daily_limit
      AND (pg.current_volume + p_amount) <= pg.monthly_limit
    ORDER BY 
      CASE WHEN cga.rotation_order > next_position THEN cga.rotation_order ELSE cga.rotation_order + 100 END
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF selected_assignment IS NOT NULL THEN
      next_position := selected_assignment.rotation_order;
    END IF;
  END IF;
  
  -- If still no gateway available, return empty
  IF selected_assignment IS NULL THEN
    RETURN;
  END IF;
  
  -- Update rotation position and usage counters
  UPDATE public.clients 
  SET current_rotation_position = next_position,
      last_rotation_at = NOW()
  WHERE id = p_client_id;
  
  UPDATE public.client_gateway_assignments
  SET daily_usage = daily_usage + p_amount,
      last_used_at = NOW()
  WHERE id = selected_assignment.id;
  
  UPDATE public.payment_gateways
  SET current_volume = current_volume + p_amount,
      usage_count_today = usage_count_today + 1,
      last_used_at = NOW()
  WHERE id = selected_assignment.gateway_id;
  
  -- Return selected gateway info
  RETURN QUERY SELECT 
    selected_assignment.gateway_id,
    selected_assignment.name,
    selected_assignment.provider,
    selected_assignment.rotation_order,
    next_position;
    
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
/* 5. ROTATION RESET FUNCTIONS                                                 */
/* -------------------------------------------------------------------------- */

-- Daily rotation counter reset (call via cron)
CREATE OR REPLACE FUNCTION public.reset_daily_rotation_counters()
RETURNS VOID AS $$
BEGIN
  -- Reset daily usage counters
  UPDATE public.client_gateway_assignments 
  SET daily_usage = 0
  WHERE last_used_at < CURRENT_DATE;
  
  UPDATE public.payment_gateways
  SET usage_count_today = 0
  WHERE last_rotation_reset < CURRENT_DATE;
  
  -- Reset rotation position for clients with daily reset enabled
  UPDATE public.clients
  SET current_rotation_position = 0
  WHERE rotation_reset_daily = true 
    AND last_rotation_at < CURRENT_DATE;
    
END;
$$ LANGUAGE plpgsql;

-- Manual rotation position reset for specific client
CREATE OR REPLACE FUNCTION public.reset_client_rotation_position(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.clients
  SET current_rotation_position = 0,
      last_rotation_at = NOW()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
/* 6. ROTATION ANALYTICS FUNCTIONS                                             */
/* -------------------------------------------------------------------------- */

-- Get rotation statistics for a client
CREATE OR REPLACE FUNCTION public.get_client_rotation_stats(
  p_client_id UUID,
  p_days INTEGER DEFAULT 7
) RETURNS TABLE(
  gateway_name TEXT,
  provider TEXT,
  rotation_order INTEGER,
  transactions_count BIGINT,
  total_amount BIGINT,
  success_rate DECIMAL,
  avg_amount DECIMAL,
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg.name,
    pg.provider,
    cga.rotation_order,
    COALESCE(SUM(rm.transactions_count), 0)::BIGINT,
    COALESCE(SUM(rm.total_amount), 0)::BIGINT,
    CASE 
      WHEN SUM(rm.transactions_count) > 0 
      THEN (SUM(rm.success_count)::DECIMAL / SUM(rm.transactions_count) * 100)
      ELSE 0 
    END,
    CASE 
      WHEN SUM(rm.transactions_count) > 0 
      THEN (SUM(rm.total_amount)::DECIMAL / SUM(rm.transactions_count))
      ELSE 0 
    END,
    cga.last_used_at
  FROM public.client_gateway_assignments cga
  JOIN public.payment_gateways pg ON pg.id = cga.gateway_id
  LEFT JOIN public.rotation_metrics rm ON rm.client_id = cga.client_id 
    AND rm.gateway_id = cga.gateway_id
    AND rm.recorded_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  WHERE cga.client_id = p_client_id
  GROUP BY pg.id, pg.name, pg.provider, cga.rotation_order, cga.last_used_at
  ORDER BY cga.rotation_order;
END;
$$ LANGUAGE plpgsql;

/* -------------------------------------------------------------------------- */
/* 7. ROW LEVEL SECURITY                                                       */
/* -------------------------------------------------------------------------- */

ALTER TABLE public.client_gateway_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON public.client_gateway_assignments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only" ON public.rotation_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

/* -------------------------------------------------------------------------- */
/* 8. SAMPLE DATA SETUP                                                        */
/* -------------------------------------------------------------------------- */

-- Function to assign gateways to a client in round-robin order
CREATE OR REPLACE FUNCTION public.assign_gateways_to_client(
  p_client_id UUID,
  p_gateway_ids UUID[]
) RETURNS VOID AS $$
DECLARE
  gateway_id UUID;
  position INTEGER := 1;
BEGIN
  -- Delete existing assignments
  DELETE FROM public.client_gateway_assignments WHERE client_id = p_client_id;
  
  -- Insert new assignments
  FOREACH gateway_id IN ARRAY p_gateway_ids
  LOOP
    INSERT INTO public.client_gateway_assignments (
      client_id, gateway_id, rotation_order, is_active
    ) VALUES (
      p_client_id, gateway_id, position, true
    );
    position := position + 1;
  END LOOP;
  
  -- Update client's total assigned gateways count
  UPDATE public.clients 
  SET total_assigned_gateways = array_length(p_gateway_ids, 1),
      current_rotation_position = 0
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- End of migration 