-- Function to get a user's uploaded images
CREATE OR REPLACE FUNCTION public.get_user_uploads(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    image_path TEXT,
    created_at TIMESTAMPTZ
)
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.image_path, p.created_at
    FROM products p
    WHERE p.user_id = p_user_id
    AND p.is_visible = true
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 