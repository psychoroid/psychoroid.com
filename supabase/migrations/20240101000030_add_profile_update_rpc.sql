-- Function to update user profile details including birthdate and organization
CREATE OR REPLACE FUNCTION update_user_profile_details(
    p_first_name TEXT,
    p_last_name TEXT,
    p_birthdate TEXT,
    p_organization TEXT,
    p_username TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_full_name TEXT;
    v_is_oauth BOOLEAN;
    v_current_metadata JSONB;
    v_formatted_date DATE;
BEGIN
    -- Check if user is OAuth
    SELECT 
        raw_app_meta_data->>'provider' IN ('google', 'github'),
        raw_user_meta_data
    INTO v_is_oauth, v_current_metadata
    FROM auth.users 
    WHERE id = auth.uid();

    -- Format date if valid
    BEGIN
        IF p_birthdate ~ '^\d{2}/\d{2}/\d{4}$' THEN
            v_formatted_date := TO_DATE(p_birthdate, 'DD/MM/YYYY');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_formatted_date := NULL;
    END;

    -- Combine first and last name
    v_full_name := TRIM(p_first_name || ' ' || p_last_name);

    -- Update auth.users metadata
    IF v_is_oauth THEN
        -- For OAuth users, only update non-name fields
        UPDATE auth.users
        SET raw_user_meta_data = v_current_metadata || jsonb_build_object(
            'birthdate', p_birthdate,
            'organization', p_organization,
            'username', COALESCE(p_username, v_current_metadata->>'username')
        )
        WHERE id = auth.uid();
    ELSE
        -- For regular users, update all fields
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'full_name', v_full_name,
            'birthdate', p_birthdate,
            'organization', p_organization,
            'username', COALESCE(p_username, v_current_metadata->>'username')
        )
        WHERE id = auth.uid();
    END IF;

    -- Update profiles table
    UPDATE profiles
    SET 
        -- Only update full_name for non-OAuth users
        full_name = CASE 
            WHEN NOT v_is_oauth THEN v_full_name 
            ELSE full_name 
        END,
        birthdate = v_formatted_date,
        organization = p_organization,
        username = COALESCE(p_username, username),
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_profile_details TO authenticated; 