-- Add format column to product_downloads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_downloads' 
        AND column_name = 'format'
    ) THEN
        ALTER TABLE product_downloads 
        ADD COLUMN format TEXT;
    END IF;
END $$;

-- Update the record_product_download function
CREATE OR REPLACE FUNCTION record_product_download(
    p_product_id UUID,
    p_format TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO product_downloads (
        product_id, 
        user_id, 
        format,
        created_at
    )
    VALUES (
        p_product_id,
        auth.uid(),
        p_format,
        NOW()
    );

    UPDATE products
    SET 
        downloads_count = downloads_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION record_product_download(UUID, TEXT) TO authenticated; 