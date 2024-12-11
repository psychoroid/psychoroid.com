-- Create function to record activity
CREATE OR REPLACE FUNCTION record_user_activity(
    p_user_id uuid,
    p_activity_type activity_type_enum,
    p_details jsonb DEFAULT NULL,
    p_product_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_activity_id uuid;
BEGIN
    INSERT INTO user_activity (user_id, activity_type, details, product_id)
    VALUES (p_user_id, p_activity_type, p_details, p_product_id)
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_user_activity(uuid, activity_type_enum, jsonb, uuid) TO authenticated;