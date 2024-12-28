-- Drop existing RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own organization" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Allow External URLs" ON public.products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.product_likes;
DROP POLICY IF EXISTS "Users can view their own ROIDS balance" ON public.user_roids;

-- Drop policies with new names to avoid conflicts
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "product_likes_select_policy" ON public.product_likes;
DROP POLICY IF EXISTS "user_roids_select_policy" ON public.user_roids;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "service_role_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_create_own_products" ON public.products;
DROP POLICY IF EXISTS "users_update_own_products" ON public.products;
DROP POLICY IF EXISTS "users_delete_own_products" ON public.products;
DROP POLICY IF EXISTS "users_like_public_products" ON public.product_likes;
DROP POLICY IF EXISTS "users_unlike_own_likes" ON public.product_likes;
DROP POLICY IF EXISTS "users_record_downloads" ON public.product_downloads;
DROP POLICY IF EXISTS "users_view_own_activity" ON public.user_activity;
DROP POLICY IF EXISTS "users_create_own_activity" ON public.user_activity;
DROP POLICY IF EXISTS "users_update_own_roids" ON public.user_roids;
DROP POLICY IF EXISTS "users_view_own_transactions" ON public.roids_transactions;
DROP POLICY IF EXISTS "users_view_own_requests" ON public.support_requests;
DROP POLICY IF EXISTS "users_create_support_requests" ON public.support_requests;
DROP POLICY IF EXISTS "users_update_own_requests" ON public.support_requests;
DROP POLICY IF EXISTS "users_view_own_feedback" ON public.feedback;
DROP POLICY IF EXISTS "users_create_feedback" ON public.feedback;
DROP POLICY IF EXISTS "users_upload_support_images" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own_support_images" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "users_create_own_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "users_update_own_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "users_record_own_views" ON public.product_views;
DROP POLICY IF EXISTS "users_view_own_history" ON public.product_views;

-- Drop other policies that need optimization
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own likes" ON product_likes;
DROP POLICY IF EXISTS "Users can view likes on their products" ON product_likes;
DROP POLICY IF EXISTS "Users can like public products" ON product_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON product_likes;
DROP POLICY IF EXISTS "Authenticated users can record downloads" ON product_downloads;
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can create their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can view their own roids" ON user_roids;
DROP POLICY IF EXISTS "Users can update their own roids" ON user_roids;
DROP POLICY IF EXISTS "Users can view their own transactions" ON roids_transactions;
DROP POLICY IF EXISTS "Users can view their own support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can create support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can update their own support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Users can upload support request images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own support request images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can record their own views" ON product_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON product_views;

-- Create function to cache auth.uid() calls
CREATE OR REPLACE FUNCTION public.get_auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT auth.uid()),
        '00000000-0000-0000-0000-000000000000'::uuid
    )
$$;

COMMENT ON FUNCTION public.get_auth_user_id() IS 'Caches auth.uid() calls to improve RLS performance';

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id_visibility ON public.products(user_id, visibility);
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON public.product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roids_user_id ON public.user_roids(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_product_downloads_product_format ON product_downloads(product_id, format);
CREATE INDEX IF NOT EXISTS idx_product_views_product_user ON product_views(product_id, user_id, view_type);

-- Create optimized consolidated policies
CREATE POLICY "products_select_policy" ON public.products
    FOR SELECT
    TO authenticated
    USING (
        visibility = 'public'::visibility_type_enum
        OR user_id = (SELECT get_auth_user_id())
    );

CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "product_likes_select_policy" ON public.product_likes
    FOR SELECT
    TO authenticated
    USING (
        product_id IN (
            SELECT id FROM public.products 
            WHERE visibility = 'public'::visibility_type_enum
            OR user_id = (SELECT get_auth_user_id())
        )
        OR user_id = (SELECT get_auth_user_id())
    );

CREATE POLICY "user_roids_select_policy" ON public.user_roids
    FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT get_auth_user_id())
    );

-- Create other optimized policies
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT
    WITH CHECK (id = (SELECT get_auth_user_id()));

CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (id = (SELECT get_auth_user_id()));

CREATE POLICY "service_role_manage_profiles" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "users_create_own_products" ON products
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_update_own_products" ON products
    FOR UPDATE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_delete_own_products" ON products
    FOR DELETE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_like_public_products" ON product_likes
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT get_auth_user_id())
        AND EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND p.visibility = 'public'::visibility_type_enum
        )
    );

CREATE POLICY "users_unlike_own_likes" ON product_likes
    FOR DELETE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_record_downloads" ON product_downloads
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_view_own_activity" ON user_activity
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_create_own_activity" ON user_activity
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_update_own_roids" ON user_roids
    FOR UPDATE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_view_own_transactions" ON roids_transactions
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_view_own_requests" ON support_requests
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_create_support_requests" ON support_requests
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_update_own_requests" ON support_requests
    FOR UPDATE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_view_own_feedback" ON feedback
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_create_feedback" ON feedback
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_upload_support_images" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'support-request-images'
        AND owner = (SELECT get_auth_user_id())
    );

CREATE POLICY "users_view_own_support_images" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'support-request-images'
        AND owner = (SELECT get_auth_user_id())
    );

CREATE POLICY "users_view_own_api_keys" ON api_keys
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_create_own_api_keys" ON api_keys
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_update_own_api_keys" ON api_keys
    FOR UPDATE
    USING (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_record_own_views" ON product_views
    FOR INSERT
    WITH CHECK (user_id = (SELECT get_auth_user_id()));

CREATE POLICY "users_view_own_history" ON product_views
    FOR SELECT
    USING (user_id = (SELECT get_auth_user_id()));

-- Add CASCADE DELETE constraints
ALTER TABLE IF EXISTS profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey,
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE; 