-- Drop the existing function first
DROP FUNCTION IF EXISTS record_product_view(UUID, text);

-- Create enhanced function with better debouncing logic
CREATE OR REPLACE FUNCTION record_product_view(
    p_product_id UUID,
    p_view_type view_type_enum DEFAULT 'click'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_last_view timestamptz;
    v_debounce_interval interval;
BEGIN
    -- Set debounce interval based on view type
    v_debounce_interval := CASE
        WHEN p_view_type = 'scroll' THEN INTERVAL '5 minutes'
        WHEN p_view_type = 'page_load' THEN INTERVAL '30 minutes'
        ELSE INTERVAL '0 minutes' -- No debounce for click views
    END;

    -- Check last view time for this user and product
    SELECT created_at INTO v_last_view
    FROM product_views
    WHERE product_id = p_product_id 
    AND user_id = auth.uid()
    AND view_type = p_view_type
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Apply debouncing logic
    IF v_last_view IS NOT NULL AND v_debounce_interval > INTERVAL '0 minutes'
       AND v_last_view > NOW() - v_debounce_interval THEN
        RETURN FALSE;
    END IF;

    -- Insert view record
    INSERT INTO product_views (product_id, user_id, view_type)
    VALUES (p_product_id, auth.uid(), p_view_type);
    
    -- Update view count
    UPDATE products
    SET 
        views_count = views_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN TRUE;
END;
$$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_user 
ON product_views(product_id, user_id, view_type);

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_product_view(UUID, view_type_enum) TO authenticated; 