-- Function to toggle product visibility
CREATE OR REPLACE FUNCTION public.toggle_product_visibility(
    p_product_path TEXT,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET 
        is_visible = false,
        updated_at = NOW()
    WHERE 
        image_path = p_product_path
        AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 