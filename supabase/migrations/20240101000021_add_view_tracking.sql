-- Add view_type enum
CREATE TYPE view_type_enum AS ENUM ('click', 'scroll', 'page_load');

-- Create product views table
CREATE TABLE product_views (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    view_type view_type_enum NOT NULL,
    created_at timestamptz default now()
);

-- Add views_count to products table
ALTER TABLE products
ADD COLUMN views_count integer default 0;

-- Function to record product view
CREATE OR REPLACE FUNCTION record_product_view(
    p_product_id UUID,
    p_view_type text
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_last_view timestamptz;
BEGIN
    -- Check last view time for this user and product
    SELECT created_at INTO v_last_view
    FROM product_views
    WHERE product_id = p_product_id 
    AND user_id = auth.uid()
    AND view_type = p_view_type::view_type_enum
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- For scroll and page_load views, require 5 minute gap between views
    -- For click views, always record
    IF p_view_type != 'click' AND v_last_view IS NOT NULL 
       AND v_last_view > NOW() - INTERVAL '5 minutes' THEN
        RETURN FALSE;
    END IF;

    -- Insert view record
    INSERT INTO product_views (product_id, user_id, view_type)
    VALUES (p_product_id, auth.uid(), p_view_type::view_type_enum);
    
    -- Update view count
    UPDATE products
    SET 
        views_count = views_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_product_view(UUID, text) TO authenticated; 