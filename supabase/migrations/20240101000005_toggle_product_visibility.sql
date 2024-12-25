-- Function to toggle product visibility
CREATE OR REPLACE FUNCTION public.toggle_product_visibility(
    p_product_path TEXT,
    p_user_id UUID
)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    UPDATE products
    SET 
        is_featured = NOT is_featured,
        updated_at = NOW()
    WHERE 
        image_path = p_product_path
        AND user_id = p_user_id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_product_visibility(TEXT, UUID) TO authenticated; 