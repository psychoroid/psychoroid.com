CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    last_activity TIMESTAMPTZ,
    roids_balance INTEGER,
    assets_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT created_at 
         FROM user_activity 
         WHERE user_id = p_user_id 
         ORDER BY created_at DESC 
         LIMIT 1),
        COALESCE((SELECT balance 
         FROM user_roids 
         WHERE user_id = p_user_id), 0),
        COALESCE((SELECT COUNT(*)::BIGINT 
         FROM products 
         WHERE user_id = p_user_id
         AND model_path IS NOT NULL
         AND model_path != ''), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_dashboard_data TO authenticated;

ALTER FUNCTION get_user_dashboard_data(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION get_user_dashboard_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;