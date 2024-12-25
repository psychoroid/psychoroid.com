-- Function to update product
CREATE OR REPLACE FUNCTION public.update_product(
    p_image_path TEXT,
    p_model_path TEXT,
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
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
        name = COALESCE(p_name, name),
        tags = COALESCE(p_tags, tags),
        updated_at = NOW()
    WHERE 
        image_path = p_image_path
        AND user_id = p_user_id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product(TEXT, TEXT, UUID, TEXT, TEXT[]) TO authenticated; 