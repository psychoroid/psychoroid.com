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
    likes_count INTEGER,
    downloads_count INTEGER,
    views_count INTEGER,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    username TEXT,
    total_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_offset INT;
    v_total_count BIGINT;
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_page_size;
    
    -- Get total count for pagination
    SELECT COUNT(*)
    INTO v_total_count
    FROM public.products p
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
        p.likes_count,
        p.downloads_count,
        p.views_count,
        p.tags,
        p.created_at,
        p.updated_at,
        p.user_id,
        pr.username,
        v_total_count as total_count
    FROM public.products p
    LEFT JOIN public.profiles pr ON p.user_id = pr.id
    WHERE p.visibility = 'public'
    AND (
        p_search_query = '' OR
        p.name ILIKE '%' || p_search_query || '%' OR
        p.description ILIKE '%' || p_search_query || '%' OR
        p.tags && ARRAY[p_search_query]
    )
    ORDER BY 
        CASE p_sort
            WHEN 'trending' THEN (p.likes_count * 3 + p.downloads_count * 2 + p.views_count)
            WHEN 'downloads' THEN p.downloads_count
            WHEN 'new' THEN EXTRACT(EPOCH FROM p.created_at)
            ELSE EXTRACT(EPOCH FROM p.created_at)
        END DESC NULLS LAST,
        -- Default sorting as fallback
        CASE WHEN p.model_path LIKE 'default-assets/%' THEN 1 ELSE 0 END,
        p.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$; 