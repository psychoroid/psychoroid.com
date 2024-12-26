-- Function to update product details
CREATE OR REPLACE FUNCTION public.update_product_content(
    p_product_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
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
        name = p_name,
        description = COALESCE(p_description, description),
        tags = COALESCE(p_tags, tags),
        updated_at = NOW()
    WHERE 
        id = p_product_id
        AND user_id = auth.uid()
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product_content(UUID, TEXT, TEXT, TEXT[]) TO authenticated; 