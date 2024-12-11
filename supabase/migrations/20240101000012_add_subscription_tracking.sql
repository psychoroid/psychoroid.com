-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
    p_user_id UUID,
    p_subscription_id TEXT,
    p_status TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE user_roids
    SET 
        is_subscribed = CASE 
            WHEN p_status = 'active' THEN true 
            ELSE false 
        END,
        subscription_id = p_subscription_id,
        subscription_status = p_status,
        subscription_period_start = p_period_start,
        subscription_period_end = p_period_end,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;

-- Function to check if user is an active subscriber
CREATE OR REPLACE FUNCTION is_active_subscriber(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_subscribed BOOLEAN;
BEGIN
    SELECT 
        is_subscribed AND subscription_status = 'active' 
        AND subscription_period_end > NOW()
    INTO v_is_subscribed
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_is_subscribed, false);
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION update_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION is_active_subscriber TO authenticated; 