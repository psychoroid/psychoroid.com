-- Create functions for support and feedback
CREATE OR REPLACE FUNCTION create_support_request(
    p_category TEXT,
    p_message TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_image_path TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_request_id UUID;
BEGIN
    INSERT INTO support_requests (
        user_id,
        category,
        message,
        image_url,
        image_path,
        status
    ) VALUES (
        auth.uid(),
        p_category,
        p_message,
        p_image_url,
        p_image_path,
        'open'
    )
    RETURNING id INTO v_request_id;

    RETURN v_request_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_support_request TO authenticated;

-- Keep existing functions
CREATE OR REPLACE FUNCTION create_feedback(
    p_sentiment feedback_sentiment_enum,
    p_message text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_feedback_id uuid;
BEGIN
    INSERT INTO feedback (
        user_id,
        message,
        sentiment
    )
    VALUES (
        auth.uid(),  -- Get the user ID from the auth context
        p_message,
        p_sentiment
    )
    RETURNING id INTO v_feedback_id;
    
    RETURN v_feedback_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_feedback TO authenticated; 