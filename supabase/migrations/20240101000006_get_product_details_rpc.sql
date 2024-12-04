-- Function to get product details
CREATE OR REPLACE FUNCTION public.get_product_details(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_url TEXT,
    created_at TIMESTAMPTZ
)
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.description, p.image_path, p.model_url, p.created_at
    FROM products p
    WHERE p.id = p_product_id
    AND p.is_visible = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 