-- Function to check if user has any products with non-starter tags
CREATE OR REPLACE FUNCTION has_non_starter_products(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM products p
        WHERE p.user_id = p_user_id
        AND (
            -- Either has more than one tag
            array_length(p.tags, 1) > 1
            OR
            -- Or has one tag that is not 'starter'
            (array_length(p.tags, 1) = 1 AND p.tags[1] != 'starter')
            OR
            -- Or has no tags
            p.tags IS NULL
            OR
            array_length(p.tags, 1) = 0
        )
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_non_starter_products(UUID) TO authenticated; 