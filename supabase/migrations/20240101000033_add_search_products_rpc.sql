-- Create a function to search products by name, description, tags, and created_at
CREATE OR REPLACE FUNCTION search_user_products(
    p_user_id UUID,
    p_search_query TEXT DEFAULT '',
    p_page_size INT DEFAULT 15,
    p_page INT DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_path TEXT,
    model_path TEXT,
    visibility visibility_type_enum,
    likes_count INT,
    downloads_count INT,
    views_count INT,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    is_featured BOOLEAN,
    total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset INT;
    v_total_count BIGINT;
    v_search_terms TEXT[];
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_page_size;
    
    -- Handle null or empty search query
    IF p_search_query IS NULL OR trim(p_search_query) = '' THEN
        -- Get total count for pagination without search filter
        SELECT COUNT(*)
        INTO v_total_count
        FROM products p
        WHERE p.user_id = p_user_id
        AND p.model_path IS NOT NULL
        AND p.model_path != '';

        -- Return all results without search filter
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
            p.is_featured,
            v_total_count as total_count
        FROM products p
        WHERE p.user_id = p_user_id
        AND p.model_path IS NOT NULL
        AND p.model_path != ''
        ORDER BY p.created_at DESC
        LIMIT p_page_size
        OFFSET v_offset;
        
        RETURN;
    END IF;
    
    -- Split search query into terms for better matching
    v_search_terms := string_to_array(lower(trim(p_search_query)), ' ');

    -- Get total count for pagination with search filter
    WITH filtered_products AS (
        SELECT p.*
        FROM products p
        WHERE p.user_id = p_user_id
        AND p.model_path IS NOT NULL
        AND p.model_path != ''
        AND EXISTS (
            SELECT 1
            FROM unnest(v_search_terms) term
            WHERE lower(COALESCE(p.name, '')) LIKE '%' || term || '%'
            OR lower(COALESCE(p.description, '')) LIKE '%' || term || '%'
            OR EXISTS (
                SELECT 1
                FROM unnest(p.tags) tag
                WHERE lower(tag) LIKE '%' || term || '%'
            )
            OR TO_CHAR(p.created_at, 'YYYY-MM-DD') LIKE '%' || term || '%'
            OR CASE 
                WHEN term = 'public' THEN p.visibility = 'public'
                WHEN term = 'private' THEN p.visibility = 'private'
                WHEN term = 'unlisted' THEN p.visibility = 'unlisted'
                ELSE false
            END
        )
    )
    SELECT COUNT(*)
    INTO v_total_count
    FROM filtered_products;

    -- Return the filtered results
    RETURN QUERY
    WITH filtered_products AS (
        SELECT p.*
        FROM products p
        WHERE p.user_id = p_user_id
        AND p.model_path IS NOT NULL
        AND p.model_path != ''
        AND EXISTS (
            SELECT 1
            FROM unnest(v_search_terms) term
            WHERE lower(COALESCE(p.name, '')) LIKE '%' || term || '%'
            OR lower(COALESCE(p.description, '')) LIKE '%' || term || '%'
            OR EXISTS (
                SELECT 1
                FROM unnest(p.tags) tag
                WHERE lower(tag) LIKE '%' || term || '%'
            )
            OR TO_CHAR(p.created_at, 'YYYY-MM-DD') LIKE '%' || term || '%'
            OR CASE 
                WHEN term = 'public' THEN p.visibility = 'public'
                WHEN term = 'private' THEN p.visibility = 'private'
                WHEN term = 'unlisted' THEN p.visibility = 'unlisted'
                ELSE false
            END
        )
    )
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
        p.is_featured,
        v_total_count as total_count
    FROM filtered_products p
    ORDER BY p.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$; 