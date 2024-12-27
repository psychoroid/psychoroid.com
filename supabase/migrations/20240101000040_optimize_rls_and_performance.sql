-- Drop existing RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

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

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_product_downloads_product_format ON product_downloads(product_id, format);
CREATE INDEX IF NOT EXISTS idx_product_views_product_user ON product_views(product_id, user_id, view_type);

-- Recreate optimized RLS policies using auth.jwt() -> 'sub'

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK ( id = (SELECT (auth.jwt() ->> 'sub')::uuid) );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING ( id = (SELECT (auth.jwt() ->> 'sub')::uuid) );

CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Products Policies
CREATE POLICY "Users can view their own products" 
    ON products FOR SELECT 
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can create their own products"
    ON products FOR INSERT
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can update their own products"
    ON products FOR UPDATE
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can delete their own products"
    ON products FOR DELETE
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Product Likes Policies
CREATE POLICY "Users can view their own likes"
    ON product_likes FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can view likes on their products"
    ON product_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_likes.product_id
            AND p.user_id = (SELECT (auth.jwt() ->> 'sub')::uuid)
        )
    );

CREATE POLICY "Users can like public products"
    ON product_likes FOR INSERT
    WITH CHECK (
        user_id = (SELECT (auth.jwt() ->> 'sub')::uuid)
        AND EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND p.visibility = 'public'
        )
    );

CREATE POLICY "Users can unlike their own likes"
    ON product_likes FOR DELETE
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Product Downloads Policy
CREATE POLICY "Authenticated users can record downloads"
    ON product_downloads FOR INSERT
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- User Activity Policies
CREATE POLICY "Users can view their own activity"
    ON user_activity FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can create their own activity"
    ON user_activity FOR INSERT
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- ROIDS Policies
CREATE POLICY "Users can view their own roids"
    ON user_roids FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can update their own roids"
    ON user_roids FOR UPDATE
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- ROIDS Transactions Policy
CREATE POLICY "Users can view their own transactions"
    ON roids_transactions FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Support Request Policies
CREATE POLICY "Users can view their own support requests"
    ON support_requests FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can create support requests"
    ON support_requests FOR INSERT
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can update their own support requests"
    ON support_requests FOR UPDATE
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Feedback Policies
CREATE POLICY "Users can view their own feedback"
    ON feedback FOR SELECT
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can create feedback"
    ON feedback FOR INSERT
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Support Request Images Storage Policies
CREATE POLICY "Users can upload support request images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'support-request-images'
        AND owner = (SELECT (auth.jwt() ->> 'sub')::uuid)
    );

CREATE POLICY "Users can view their own support request images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'support-request-images'
        AND owner = (SELECT (auth.jwt() ->> 'sub')::uuid)
    );

-- API Keys Policies
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    TO authenticated
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can create their own API keys"
    ON api_keys FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Product Views Policies
CREATE POLICY "Users can record their own views"
    ON product_views FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

CREATE POLICY "Users can view their own view history"
    ON product_views FOR SELECT
    TO authenticated
    USING (user_id = (SELECT (auth.jwt() ->> 'sub')::uuid));

-- Add CASCADE DELETE constraints
ALTER TABLE IF EXISTS profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey,
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE; 