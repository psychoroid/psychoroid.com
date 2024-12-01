-- Function to update product image path
CREATE OR REPLACE FUNCTION public.update_product_image(
    p_product_id UUID,
    p_image_path TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET 
        image_path = p_image_path,
        updated_at = NOW()
    WHERE 
        id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp; 