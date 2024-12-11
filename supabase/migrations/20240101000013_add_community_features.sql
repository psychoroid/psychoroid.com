-- Function to get trending products
CREATE OR REPLACE FUNCTION get_trending_products(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    visibility visibility_type_enum,
    likes_count INTEGER,
    downloads_count INTEGER,
    tags TEXT[],
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.image_path,
        p.model_path,
        p.visibility,
        p.likes_count,
        p.downloads_count,
        p.tags,
        p.is_featured,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE p.visibility = 'public'
    ORDER BY (p.likes_count + p.downloads_count) DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get featured products
CREATE OR REPLACE FUNCTION get_featured_products(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    visibility visibility_type_enum,
    likes_count INTEGER,
    downloads_count INTEGER,
    tags TEXT[],
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.image_path,
        p.model_path,
        p.visibility,
        p.likes_count,
        p.downloads_count,
        p.tags,
        p.is_featured,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE p.visibility = 'public' AND p.is_featured = true
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to like/unlike a product
CREATE OR REPLACE FUNCTION toggle_product_like(
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_liked BOOLEAN;
BEGIN
    -- Check if user has already liked the product
    IF EXISTS (
        SELECT 1 FROM product_likes
        WHERE product_id = p_product_id AND user_id = auth.uid()
    ) THEN
        -- Unlike
        DELETE FROM product_likes
        WHERE product_id = p_product_id AND user_id = auth.uid();
        
        UPDATE products
        SET likes_count = likes_count - 1
        WHERE id = p_product_id;
        
        v_liked := false;
    ELSE
        -- Like
        INSERT INTO product_likes (product_id, user_id)
        VALUES (p_product_id, auth.uid());
        
        UPDATE products
        SET likes_count = likes_count + 1
        WHERE id = p_product_id;
        
        v_liked := true;
    END IF;

    RETURN v_liked;
END;
$$;

-- Function to record a download
CREATE OR REPLACE FUNCTION record_product_download(
    p_product_id UUID,
    p_format TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_last_download TIMESTAMPTZ;
BEGIN
    -- Check last download time
    SELECT created_at INTO v_last_download
    FROM product_downloads
    WHERE product_id = p_product_id 
    AND user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Only record if no download in last 5 seconds
    IF v_last_download IS NULL OR v_last_download < NOW() - INTERVAL '5 seconds' THEN
        INSERT INTO product_downloads (product_id, user_id, format)
        VALUES (p_product_id, auth.uid(), p_format);
        
        UPDATE products
        SET downloads_count = downloads_count + 1
        WHERE id = p_product_id;
    END IF;
END;
$$;

-- Add this function
CREATE OR REPLACE FUNCTION get_user_product_likes(p_user_id UUID)
RETURNS TABLE (product_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT pl.product_id
    FROM product_likes pl
    WHERE pl.user_id = p_user_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_trending_products(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_featured_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_product_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_product_download(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_product_likes(UUID) TO authenticated; 