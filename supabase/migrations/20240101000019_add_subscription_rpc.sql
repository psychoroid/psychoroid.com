-- Function to get user's subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id UUID)
RETURNS TABLE (
    subscription_type subscription_type_enum,
    subscription_status subscription_status_enum,
    subscription_period_end TIMESTAMPTZ,
    is_subscribed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.subscription_type,
        ur.subscription_status,
        ur.subscription_period_end,
        ur.is_subscribed
    FROM user_roids ur
    WHERE ur.user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_subscription_details TO authenticated; 