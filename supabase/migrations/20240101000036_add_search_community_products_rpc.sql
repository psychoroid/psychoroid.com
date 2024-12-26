-- Create a function to search and paginate community products
CREATE OR REPLACE FUNCTION search_community_products(
    p_search_query TEXT DEFAULT '',
    p_page_size INT DEFAULT 15,
    p_page INT DEFAULT 1,
    p_sort TEXT DEFAULT 'trending'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    visibility visibility_type_enum,
    likes_count BIGINT,
    downloads_count BIGINT,
    views_count BIGINT,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    username TEXT,
    total_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_offset INT;
    v_total_count BIGINT;
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_page_size;
    
    -- Get total count for pagination
    SELECT COUNT(*)
    INTO v_total_count
    FROM products p
    WHERE p.visibility = 'public'
    AND (
        p_search_query = '' OR
        p.name ILIKE '%' || p_search_query || '%' OR
        p.description ILIKE '%' || p_search_query || '%' OR
        p.tags && ARRAY[p_search_query]
    );

    -- Return the results
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.image_path,
        p.model_path,
        p.visibility,
        COALESCE(pl.likes_count, 0::BIGINT) as likes_count,
        COALESCE(pd.downloads_count, 0::BIGINT) as downloads_count,
        COALESCE(pv.views_count, 0::BIGINT) as views_count,
        p.tags,
        p.created_at,
        p.updated_at,
        p.user_id,
        pr.username,
        v_total_count as total_count
    FROM products p
    LEFT JOIN profiles pr ON p.user_id = pr.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as likes_count
        FROM product_likes
        GROUP BY product_id
    ) pl ON p.id = pl.product_id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as downloads_count
        FROM product_downloads
        GROUP BY product_id
    ) pd ON p.id = pd.product_id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as views_count
        FROM product_views
        GROUP BY product_id
    ) pv ON p.id = pv.product_id
    WHERE p.visibility = 'public'
    AND (
        p_search_query = '' OR
        p.name ILIKE '%' || p_search_query || '%' OR
        p.description ILIKE '%' || p_search_query || '%' OR
        p.tags && ARRAY[p_search_query]
    )
    ORDER BY 
        CASE 
            WHEN p_sort = 'trending' THEN (COALESCE(pl.likes_count, 0) + COALESCE(pd.downloads_count, 0) + COALESCE(pv.views_count, 0))
            WHEN p_sort = 'downloads' THEN COALESCE(pd.downloads_count, 0)
            ELSE NULL
        END DESC NULLS LAST,
        CASE 
            WHEN p_sort = 'new' THEN p.created_at
            ELSE NULL
        END DESC NULLS LAST,
        -- Default sorting as fallback
        CASE WHEN p.model_path LIKE 'default-assets/%' THEN 1 ELSE 0 END,
        p.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$; 