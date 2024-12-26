-- Function to add subscription credits
CREATE OR REPLACE FUNCTION add_subscription_credits(
    p_user_id UUID,
    p_subscription_type TEXT,
    p_subscription_id TEXT,
    p_customer_id TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_credits INTEGER;
BEGIN
    -- Determine credits based on subscription type
    v_credits := CASE 
        WHEN p_subscription_type = 'automate' THEN 300
        WHEN p_subscription_type = 'scale' THEN 1200
        ELSE 0
    END;

    -- Update user's subscription type and add credits
    UPDATE user_roids
    SET 
        subscription_type = p_subscription_type::subscription_type_enum,
        balance = v_credits,
        is_subscribed = TRUE,
        subscription_status = 'active'::subscription_status_enum,
        subscription_id = p_subscription_id,
        stripe_customer_id = p_customer_id,
        subscription_period_start = p_period_start,
        subscription_period_end = p_period_end,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record the transaction
    IF v_credits > 0 THEN
        INSERT INTO roids_transactions (
            user_id,
            amount,
            transaction_type,
            description
        ) VALUES (
            p_user_id,
            v_credits,
            'subscription',
            'Initial subscription credits: ' || p_subscription_type
        );
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_subscription_credits(
    UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ
) TO authenticated;

-- Function to update subscription type only
CREATE OR REPLACE FUNCTION update_subscription_type(
    p_user_id UUID,
    p_subscription_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Update user's subscription type only
    UPDATE user_roids
    SET 
        subscription_type = p_subscription_type::subscription_type_enum,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record the change in user activity
    INSERT INTO user_activity (
        user_id,
        activity_type,
        details
    ) VALUES (
        p_user_id,
        'subscription_updated',
        jsonb_build_object('new_type', p_subscription_type)
    );
END;
$$;

-- Grant execute permission to service role only (for admin use)
GRANT EXECUTE ON FUNCTION update_subscription_type(UUID, TEXT) TO service_role;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits(
    p_user_id UUID DEFAULT NULL -- If NULL, process all eligible users
)
RETURNS INTEGER -- Returns number of users processed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_users_processed INTEGER := 0;
    v_base_credits INTEGER;
    v_user RECORD;
BEGIN
    -- Process users whose subscription_period_start is more than a month ago
    -- or users who haven't had a reset in the last month
    FOR v_user IN (
        SELECT 
            ur.user_id,
            ur.subscription_type,
            ur.subscription_status,
            ur.subscription_period_start,
            ur.balance
        FROM user_roids ur
        WHERE (p_user_id IS NULL OR ur.user_id = p_user_id)
        AND ur.subscription_status = 'active'
        AND (
            -- For subscribed users: check if it's time for monthly reset
            -- and ensure we don't reset if they just subscribed (within last day)
            (ur.is_subscribed = true AND (
                ur.subscription_period_start + INTERVAL '1 month' <= NOW()
                AND ur.subscription_period_start + INTERVAL '1 day' <= NOW()
            ))
            OR
            -- For free users: check if they haven't had a reset in the last month
            (ur.subscription_type = 'free' AND (
                ur.updated_at + INTERVAL '1 month' <= NOW()
            ))
        )
    ) LOOP
        -- Determine base credits based on subscription type
        v_base_credits := CASE 
            WHEN v_user.subscription_type = 'automate' THEN 300
            WHEN v_user.subscription_type = 'scale' THEN 1200
            WHEN v_user.subscription_type = 'free' THEN 30
            ELSE 0
        END;

        -- Only process if credits need to be reset
        -- (avoid unnecessary updates and transactions)
        IF v_user.balance != v_base_credits THEN
            -- Reset credits to base amount
            UPDATE user_roids
            SET 
                balance = v_base_credits,
                updated_at = NOW(),
                subscription_period_start = 
                    CASE 
                        WHEN is_subscribed THEN NOW() -- Reset period for subscribers
                        ELSE subscription_period_start -- Keep original for free users
                    END
            WHERE user_id = v_user.user_id;

            -- Record the transaction
            INSERT INTO roids_transactions (
                user_id,
                amount,
                transaction_type,
                description
            ) VALUES (
                v_user.user_id,
                v_base_credits,
                'subscription',
                'Monthly credit reset for ' || v_user.subscription_type || ' plan'
            );

            v_users_processed := v_users_processed + 1;
        END IF;
    END LOOP;

    RETURN v_users_processed;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION reset_monthly_credits(UUID) TO service_role; 