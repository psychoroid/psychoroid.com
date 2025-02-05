-- Function to get stripe customer ID
CREATE OR REPLACE FUNCTION get_stripe_customer_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer_id TEXT;
BEGIN
    SELECT stripe_customer_id INTO v_customer_id
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN v_customer_id;
END;
$$;

-- Function to create or update stripe customer
CREATE OR REPLACE FUNCTION upsert_stripe_customer(
    p_user_id UUID,
    p_stripe_customer_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO user_roids (user_id, stripe_customer_id)
    VALUES (p_user_id, p_stripe_customer_id)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        updated_at = NOW();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_stripe_customer_id TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_stripe_customer TO service_role; 