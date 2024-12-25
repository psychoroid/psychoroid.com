-- Function to toggle model public/private visibility
CREATE OR REPLACE FUNCTION toggle_model_visibility(
    p_product_id UUID,
    p_visibility visibility_type_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID cannot be null';
    END IF;
    
    IF p_visibility IS NULL THEN
        RAISE EXCEPTION 'Visibility cannot be null';
    END IF;

    -- Check if user owns the product
    SELECT user_id INTO v_owner_id
    FROM products
    WHERE id = p_product_id;
    
    IF v_owner_id != auth.uid() THEN
        RETURN FALSE;
    END IF;
    
    -- Update visibility
    UPDATE products
    SET 
        visibility = p_visibility,
        updated_at = NOW()
    WHERE id = p_product_id
    AND user_id = auth.uid();
    
    -- Record activity with correct enum value
    INSERT INTO user_activity (
        user_id,
        activity_type,
        product_id,
        details
    ) VALUES (
        auth.uid(),
        'visibility_changed',
        p_product_id,
        jsonb_build_object('new_visibility', p_visibility)
    );
    
    RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_model_visibility(UUID, visibility_type_enum) TO authenticated; 