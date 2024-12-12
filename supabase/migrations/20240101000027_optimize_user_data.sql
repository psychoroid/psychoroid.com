CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
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
    RETURN QUERY
    SELECT 
        (SELECT created_at 
         FROM user_activity 
         WHERE user_id = p_user_id 
         ORDER BY created_at DESC 
         LIMIT 1),
        (SELECT balance 
         FROM user_roids 
         WHERE user_id = p_user_id),
        (SELECT COUNT(*)::BIGINT 
         FROM products 
         WHERE user_id = p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_dashboard_data TO authenticated;

ALTER FUNCTION get_user_dashboard_data(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION get_user_dashboard_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;

ALTER TABLE user_roids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roids balance"
    ON user_roids FOR SELECT
    USING (auth.uid() = user_id); 