-- Create the api_key_status_enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE api_key_status_enum AS ENUM ('active', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the api_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    status api_key_status_enum DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to generate a new API key
CREATE OR REPLACE FUNCTION generate_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_expires_in TEXT DEFAULT '1 year'
)
RETURNS TABLE (
    key TEXT,
    prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
    v_key TEXT;
    v_prefix TEXT;
    v_key_hash TEXT;
    v_active_keys INT;
BEGIN
    -- Check the number of active keys
    SELECT COUNT(*)
    INTO v_active_keys
    FROM api_keys
    WHERE user_id = p_user_id AND status = 'active';

    IF v_active_keys >= 3 THEN
        RAISE EXCEPTION 'Maximum number of active API keys (3) reached';
    END IF;

    -- Generate a random API key with psychoroid prefix
    v_key := 'pskrd_sk_' || encode(extensions.digest(gen_random_uuid()::text, 'sha256'), 'hex');
    v_prefix := substring(v_key from 10 for 8);
    v_key_hash := extensions.crypt(v_key, extensions.gen_salt('bf'));

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
        now() + p_expires_in::interval
    );

    -- Make sure we're returning both values explicitly
    RETURN QUERY 
    SELECT v_key AS key, v_prefix AS prefix;
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
SET search_path = public
AS $$
BEGIN
    UPDATE api_keys
    SET 
        status = 'revoked',
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
SET search_path = public
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

-- Grant permissions for API key functions
GRANT EXECUTE ON FUNCTION generate_api_key(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_api_key(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_api_keys(UUID) TO authenticated;

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;

-- Create RLS policies
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
    ON api_keys FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);