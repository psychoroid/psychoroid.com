-- Add function to initialize user profile
CREATE OR REPLACE FUNCTION initialize_user_profile(
    p_user_id UUID,
    p_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count int;
BEGIN
    -- Check if profile already exists
    SELECT COUNT(*) INTO v_count
    FROM profiles
    WHERE id = p_user_id;

    IF v_count = 0 THEN
        -- Create profile if it doesn't exist
        INSERT INTO profiles (id, email)
        VALUES (p_user_id, p_email);
    ELSE
        -- Update email if profile exists
        UPDATE profiles
        SET 
            email = p_email,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    -- Initialize user_roids if doesn't exist
    INSERT INTO user_roids (user_id, balance, subscription_type)
    VALUES (p_user_id, 0, 'free')
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION initialize_user_profile TO authenticated;