-- Migration to enhance the gateway selection function for atomic updates.
-- This ensures that selecting and updating a gateway is a single, uninterruptible operation.

CREATE OR REPLACE FUNCTION public.select_gateway_for_amount(p_amount INTEGER)
RETURNS SETOF public.payment_gateways AS $$
DECLARE
    selected_gateway_id UUID;
BEGIN
    -- Step 1 & 2 & 3: Filter, Sort, and Lock the best available gateway
    SELECT id INTO selected_gateway_id
    FROM public.payment_gateways
    WHERE 
        is_active = TRUE
        AND temp_failed = FALSE
        AND (current_volume + p_amount) < monthly_limit
    ORDER BY 
        priority DESC, 
        success_rate DESC, 
        last_used_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If a gateway was found and locked, proceed to update it
    IF selected_gateway_id IS NOT NULL THEN
        -- Step 4: Update the volume and timestamp atomically
        UPDATE public.payment_gateways
        SET 
            current_volume = current_volume + p_amount,
            last_used_at = NOW()
        WHERE id = selected_gateway_id;

        -- Step 5: Return the full record of the selected and updated gateway
        RETURN QUERY 
        SELECT * 
        FROM public.payment_gateways 
        WHERE id = selected_gateway_id;
    END IF;

    -- If no gateway is found, the function returns an empty set.
END;
$$ LANGUAGE plpgsql; 