-- Function to update user organization
CREATE OR REPLACE FUNCTION update_user_organization(
    p_user_id UUID,
    p_organization TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Update the organization in user_roids table
    UPDATE user_roids
    SET organization = p_organization
    WHERE user_id = p_user_id;

    -- Update the organization in auth.users metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('organization', p_organization)
            ELSE 
                jsonb_set(
                    raw_user_meta_data,
                    '{organization}',
                    to_jsonb(p_organization)
                )
        END
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_organization TO authenticated;

-- Add RLS policy for organization updates
CREATE POLICY "Users can update their own organization"
    ON user_roids
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 