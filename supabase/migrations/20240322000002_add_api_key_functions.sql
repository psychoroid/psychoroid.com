-- Function to generate a new API key
CREATE OR REPLACE FUNCTION generate_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_expires_in INTERVAL DEFAULT INTERVAL '1 year'
)
RETURNS TABLE (
    key TEXT,
    prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_key TEXT;
    v_prefix TEXT;
    v_key_hash TEXT;
BEGIN
    -- Generate a random API key (format: pk_live_xxxxxx)
    v_key := 'pk_live_' || encode(gen_random_bytes(24), 'base64');
    v_prefix := split_part(v_key, '_', 3);
    v_key_hash := crypt(v_key, gen_salt('bf'));

    -- Insert the new API key
    INSERT INTO api_keys (
        user_id,
        name,
        key_hash,
        prefix,
        expires_at
    ) VALUES (
        p_user_id,
        p_name,
        v_key_hash,
        v_prefix,
        now() + p_expires_in
    );

    RETURN QUERY SELECT v_key, v_prefix;
END;
$$;

-- Function to revoke an API key
CREATE OR REPLACE FUNCTION revoke_api_key(
    p_user_id UUID,
    p_prefix TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE api_keys
    SET 
        status = 'revoked'::api_key_status_enum,
        updated_at = now()
    WHERE 
        user_id = p_user_id 
        AND prefix = p_prefix
        AND status = 'active';

    RETURN FOUND;
END;
$$;

-- Function to list user's API keys
CREATE OR REPLACE FUNCTION list_api_keys(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    prefix TEXT,
    status api_key_status_enum,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.name,
        k.prefix,
        k.status,
        k.last_used_at,
        k.expires_at,
        k.created_at
    FROM api_keys k
    WHERE k.user_id = p_user_id
    ORDER BY k.created_at DESC;
END;
$$;

-- Add RLS policies
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_api_key(UUID, TEXT, INTERVAL) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_api_key(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_api_keys(UUID) TO authenticated; 