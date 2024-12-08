--------------- ROIDS SYSTEM ---------------

-- Create RLS policies
create policy "System can insert transactions"
    on roids_transactions for insert
    to service_role
    with check (true); 

-- RPC Functions for ROIDS System

-- Function to get user's ROIDS balance
CREATE OR REPLACE FUNCTION get_user_roids_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$;

-- Function to check if user has sufficient ROIDS
CREATE OR REPLACE FUNCTION check_roids_balance(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0) >= p_amount;
END;
$$;

-- Function to record ROIDS transaction
CREATE OR REPLACE FUNCTION record_roids_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_stripe_session_id TEXT DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO roids_transactions (
        user_id,
        amount,
        transaction_type,
        stripe_session_id,
        product_id,
        description
    )
    VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_stripe_session_id,
        p_product_id,
        p_description
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Function to get user's transaction history
CREATE OR REPLACE FUNCTION get_user_roids_transactions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    amount INTEGER,
    transaction_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    stripe_session_id TEXT,
    product_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.amount,
        rt.transaction_type,
        rt.description,
        rt.created_at,
        rt.stripe_session_id,
        rt.product_id
    FROM roids_transactions rt
    WHERE rt.user_id = p_user_id
    ORDER BY rt.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to use ROIDS for asset generation
CREATE OR REPLACE FUNCTION use_roids_for_asset(
    p_user_id UUID,
    p_amount INTEGER,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Check current balance
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF COALESCE(v_balance, 0) < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Record the transaction
    PERFORM record_roids_transaction(
        p_user_id,
        -p_amount,
        'usage',
        NULL,
        p_product_id,
        'Asset generation'
    );
    
    RETURN TRUE;
END;
$$;

-- Function to initialize user with free ROIDS on signup
CREATE OR REPLACE FUNCTION initialize_user_roids()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO user_roids (
        user_id,
        balance,
        subscription_type
    ) VALUES (
        NEW.id,
        200,  -- Initial free ROIDS
        'free'
    );

    -- Record the initial ROIDS transaction
    PERFORM record_roids_transaction(
        NEW.id,
        200,
        'purchase',
        NULL,
        NULL,
        'Initial signup bonus'
    );

    RETURN NEW;
END;
$$;

-- Create trigger to automatically give ROIDS on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_roids();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION initialize_user_roids() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_roids_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_roids_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_roids_transaction(UUID, INTEGER, TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_roids_transactions(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_roids_for_asset(UUID, INTEGER, UUID) TO authenticated; 