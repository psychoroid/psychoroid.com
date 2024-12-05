-- Function to get product details
CREATE OR REPLACE FUNCTION public.get_product_details(p_image_path TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_visible BOOLEAN
)
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.description, p.image_path, p.model_path, p.user_id, p.created_at, p.updated_at, p.is_visible
    FROM products p
    WHERE p.image_path = p_image_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 