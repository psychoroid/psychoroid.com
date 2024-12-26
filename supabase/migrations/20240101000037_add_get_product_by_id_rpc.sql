-- Function to get product details by ID
CREATE OR REPLACE FUNCTION public.get_product_by_id(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    visibility visibility_type_enum,
    likes_count INTEGER,
    downloads_count INTEGER,
    views_count INTEGER,
    tags TEXT[],
    username TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.image_path,
        p.model_path,
        p.user_id,
        p.created_at,
        p.updated_at,
        p.visibility,
        p.likes_count,
        p.downloads_count,
        p.views_count,
        p.tags,
        pr.username
    FROM products p
    LEFT JOIN profiles pr ON p.user_id = pr.id
    WHERE p.id = p_product_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION get_product_by_id(UUID) TO authenticated; 