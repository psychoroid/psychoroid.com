-- Function to record product downloads
CREATE OR REPLACE FUNCTION public.record_product_download(
    p_product_id UUID,
    p_format TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Validate the product exists and is accessible to the user
    IF NOT EXISTS (
        SELECT 1 
        FROM products 
        WHERE id = p_product_id 
        AND (visibility = 'public' OR user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Product not found or not accessible';
    END IF;

    -- Record the download
    INSERT INTO product_downloads (
        product_id, 
        user_id, 
        format
    )
    VALUES (
        p_product_id, 
        auth.uid(), 
        p_format
    );

    -- Update the download count
    UPDATE products 
    SET 
        downloads_count = downloads_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION record_product_download(UUID, TEXT) TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_product_downloads_product_format 
ON product_downloads(product_id, format);