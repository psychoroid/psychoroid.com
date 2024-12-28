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

-- Function to update product name
CREATE OR REPLACE FUNCTION public.update_product_name(
    p_product_id UUID,
    p_name TEXT
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
        updated_at = NOW()
    WHERE 
        id = p_product_id
        AND user_id = auth.uid()
    RETURNING *;
END;
$$;

-- Function to update product description
CREATE OR REPLACE FUNCTION public.update_product_description(
    p_product_id UUID,
    p_description TEXT
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
        description = p_description,
        updated_at = NOW()
    WHERE 
        id = p_product_id
        AND user_id = auth.uid()
    RETURNING *;
END;
$$;

-- Function to update product tags
CREATE OR REPLACE FUNCTION public.update_product_tags(
    p_product_id UUID,
    p_tags TEXT[]
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
        tags = p_tags,
        updated_at = NOW()
    WHERE 
        id = p_product_id
        AND user_id = auth.uid()
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product_content(UUID, TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_name(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_description(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_tags(UUID, TEXT[]) TO authenticated; 