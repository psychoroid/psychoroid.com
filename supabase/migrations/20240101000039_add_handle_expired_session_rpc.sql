-- Add session_expired to activity_type_enum
ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'session_expired';

-- Create a function to handle expired Stripe sessions
CREATE OR REPLACE FUNCTION handle_expired_session(
    p_user_id UUID,
    p_session_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert into roids_transactions
    INSERT INTO roids_transactions (
        user_id,
        amount,
        transaction_type,
        stripe_session_id,
        description
    ) VALUES (
        p_user_id,
        0,
        'subscription',  -- Using 'subscription' type as it's the closest match
        p_session_id,
        'Checkout session expired'
    );

    -- Log the event in user_activities
    INSERT INTO user_activities (
        user_id,
        activity_type,
        metadata
    ) VALUES (
        p_user_id,
        'session_expired',
        jsonb_build_object(
            'session_id', p_session_id,
            'timestamp', CURRENT_TIMESTAMP
        )
    );

    -- Update user_roids subscription status if needed
    UPDATE user_roids
    SET 
        subscription_status = 'unpaid',
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
END;
$$; 