-- Create enhanced function with better debouncing logic
CREATE OR REPLACE FUNCTION record_product_view(
    p_product_id UUID,
    p_view_type view_type_enum DEFAULT 'click'
)
RETURNS TABLE (
    success BOOLEAN,
    views_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_last_view timestamptz;
    v_view_count integer;
BEGIN
    -- Get current view count first
    SELECT products.views_count INTO v_view_count
    FROM products 
    WHERE id = p_product_id;

    -- Check last view time for this user and product
    SELECT created_at INTO v_last_view
    FROM product_views
    WHERE product_id = p_product_id 
    AND user_id = auth.uid()
    AND view_type = p_view_type
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Different debounce times for different view types
    CASE p_view_type
        WHEN 'scroll' THEN
            -- Only count if no scroll view in last 5 minutes
            IF v_last_view IS NULL OR v_last_view < NOW() - INTERVAL '5 minutes' THEN
                INSERT INTO product_views (product_id, user_id, view_type)
                VALUES (p_product_id, auth.uid(), p_view_type);
                
                UPDATE products
                SET views_count = COALESCE(products.views_count, 0) + 1,
                    updated_at = NOW()
                WHERE id = p_product_id
                RETURNING products.views_count INTO v_view_count;
                
                RETURN QUERY SELECT true, v_view_count;
                RETURN;
            END IF;
            
        WHEN 'page_load' THEN
            -- Only count if no page_load view in last 30 minutes
            IF v_last_view IS NULL OR v_last_view < NOW() - INTERVAL '30 minutes' THEN
                INSERT INTO product_views (product_id, user_id, view_type)
                VALUES (p_product_id, auth.uid(), p_view_type);
                
                UPDATE products
                SET views_count = COALESCE(products.views_count, 0) + 1,
                    updated_at = NOW()
                WHERE id = p_product_id
                RETURNING products.views_count INTO v_view_count;
                
                RETURN QUERY SELECT true, v_view_count;
                RETURN;
            END IF;
            
        WHEN 'click' THEN
            -- Always count clicks but with 5 second debounce
            IF v_last_view IS NULL OR v_last_view < NOW() - INTERVAL '5 seconds' THEN
                INSERT INTO product_views (product_id, user_id, view_type)
                VALUES (p_product_id, auth.uid(), p_view_type);
                
                UPDATE products
                SET views_count = COALESCE(products.views_count, 0) + 1,
                    updated_at = NOW()
                WHERE id = p_product_id
                RETURNING products.views_count INTO v_view_count;
                
                RETURN QUERY SELECT true, v_view_count;
                RETURN;
            END IF;
    END CASE;
    
    RETURN QUERY SELECT false, v_view_count;
END;
$$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_user 
ON product_views(product_id, user_id, view_type);

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_product_view(UUID, view_type_enum) TO authenticated; 