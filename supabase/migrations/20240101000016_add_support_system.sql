-- Create functions for support and feedback
CREATE OR REPLACE FUNCTION create_support_request(
    p_user_id uuid,
    p_category text,
    p_message text,
    p_image_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_id uuid;
BEGIN
    INSERT INTO support_requests (user_id, category, message, image_url)
    VALUES (p_user_id, p_category, p_message, p_image_url)
    RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_feedback(
    p_user_id uuid,
    p_message text,
    p_sentiment feedback_sentiment_enum
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_feedback_id uuid;
BEGIN
    INSERT INTO feedback (user_id, message, sentiment)
    VALUES (p_user_id, p_message, p_sentiment)
    RETURNING id INTO v_feedback_id;
    
    RETURN v_feedback_id;
END;
$$; 