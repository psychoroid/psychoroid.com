-- Function to update product
CREATE OR REPLACE FUNCTION public.update_product(
    p_image_path TEXT,
    p_model_path TEXT,
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
        model_path = p_model_path,
        updated_at = NOW()
    WHERE 
        image_path = p_image_path
        AND user_id = p_user_id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product(TEXT, TEXT, UUID) TO authenticated; 