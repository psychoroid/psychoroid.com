-- Function to toggle product visibility
CREATE OR REPLACE FUNCTION toggle_product_visibility(
    p_product_path TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_id UUID;
BEGIN
    -- Get the product ID and verify ownership
    SELECT id INTO v_product_id
    FROM products
    WHERE image_path = p_product_path
    AND user_id = p_user_id;

    IF v_product_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Toggle visibility between public and private
    UPDATE products
    SET 
        visibility = CASE 
            WHEN visibility = 'public' THEN 'private'::visibility_type_enum
            ELSE 'public'::visibility_type_enum
        END,
        updated_at = NOW()
    WHERE id = v_product_id;

    -- Record the activity
    INSERT INTO user_activity (
        user_id,
        activity_type,
        product_id,
        details
    ) VALUES (
        p_user_id,
        'visibility_changed',
        v_product_id,
        jsonb_build_object(
            'new_visibility', 
            CASE 
                WHEN (SELECT visibility FROM products WHERE id = v_product_id) = 'public' 
                THEN 'public' 
                ELSE 'private' 
            END
        )
    );

    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_product_visibility(TEXT, UUID) TO authenticated; 