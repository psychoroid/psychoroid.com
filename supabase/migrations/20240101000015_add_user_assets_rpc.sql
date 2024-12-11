-- Function to get user's assets with pagination and search
CREATE OR REPLACE FUNCTION get_user_assets(
    p_user_id UUID,
    p_search TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
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
    tags TEXT[],
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
        p.name,
        p.description,
        p.image_path,
        p.model_path,
        p.visibility,
        p.likes_count,
        p.downloads_count,
        p.tags,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE p.user_id = p_user_id
    AND (
        p_search = '' 
        OR p.name ILIKE '%' || p_search || '%'
        OR p.description ILIKE '%' || p_search || '%'
        OR EXISTS (
            SELECT 1 FROM unnest(p.tags) tag
            WHERE tag ILIKE '%' || p_search || '%'
        )
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_assets(UUID, TEXT, INTEGER, INTEGER) TO authenticated; 