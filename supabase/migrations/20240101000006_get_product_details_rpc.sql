-- Function to get product details
CREATE OR REPLACE FUNCTION public.get_product_details(p_image_path TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    created_at TIMESTAMPTZ
)
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.description, p.image_path, p.model_path, p.created_at
    FROM products p
    WHERE p.image_path = p_image_path
    AND p.is_visible = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 