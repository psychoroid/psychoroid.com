-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    p_first_name TEXT,
    p_last_name TEXT,
    p_company TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{full_name}',
        to_jsonb(TRIM(p_first_name || ' ' || p_last_name))
    )
    WHERE id = auth.uid();

    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{company}',
        to_jsonb(p_company)
    )
    WHERE id = auth.uid();

    RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated; 