-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roids ENABLE ROW LEVEL SECURITY;
ALTER TABLE roids_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

DROP POLICY IF EXISTS "Anyone can view likes" ON product_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON product_likes;
DROP POLICY IF EXISTS "Users can view likes on their products" ON product_likes;
DROP POLICY IF EXISTS "Users can like public products" ON product_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON product_likes;

DROP POLICY IF EXISTS "Anyone can view download counts" ON product_downloads;
DROP POLICY IF EXISTS "Authenticated users can record downloads" ON product_downloads;

DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can create their own activity" ON user_activity;
DROP POLICY IF EXISTS "Service role can manage activity" ON user_activity;

DROP POLICY IF EXISTS "Users can view their own support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can create support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can update their own support requests" ON support_requests;

DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;

DROP POLICY IF EXISTS "Users can record their own views" ON product_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON product_views;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Allow the service role to manage profiles
CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant profiles permissions
GRANT ALL ON profiles TO authenticated;

-- Products Policies
CREATE POLICY "Public products are viewable by everyone" 
    ON products FOR SELECT 
    USING (visibility = 'public');

CREATE POLICY "Users can view their own products" 
    ON products FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- Product Likes Policies
CREATE POLICY "Anyone can view likes"
    ON product_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own likes"
    ON product_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes on their products"
    ON product_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_likes.product_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can like public products"
    ON product_likes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND p.visibility = 'public'
        )
    );

CREATE POLICY "Users can unlike their own likes"
    ON product_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Product Downloads Policies
CREATE POLICY "Anyone can view download counts"
    ON product_downloads FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can record downloads"
    ON product_downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Activity Policies
CREATE POLICY "Users can view their own activity"
    ON user_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity"
    ON user_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage activity"
    ON user_activity FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable RLS on user_activity table if not already enabled
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- ROIDS Policies
CREATE POLICY "Users can view their own roids"
    ON user_roids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roids"
    ON user_roids FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage all user_roids"
    ON user_roids
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ROIDS Transactions Policies
CREATE POLICY "Users can view their own transactions"
    ON roids_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions"
    ON roids_transactions 
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Support Request Policies
CREATE POLICY "Users can view their own support requests"
    ON support_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create support requests"
    ON support_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support requests"
    ON support_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- Feedback Policies
CREATE POLICY "Users can view their own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Support Request Images Storage Policies
CREATE POLICY "Users can upload support request images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'support-request-images'
        AND auth.uid() = owner
    );

CREATE POLICY "Users can view their own support request images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'support-request-images'
        AND auth.uid() = owner
    );

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON support_requests TO authenticated;
GRANT SELECT, UPDATE ON user_roids TO authenticated;
GRANT SELECT ON user_activity TO authenticated;
GRANT INSERT ON user_activity TO authenticated;

-- API Keys Policies
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
    ON api_keys FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Activity Policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;

CREATE POLICY "Users can view their own activity"
    ON user_activity FOR SELECT
    USING (auth.uid() = user_id);

-- ROIDS System Policies
DROP POLICY IF EXISTS "System can insert transactions" ON roids_transactions;

CREATE POLICY "System can insert transactions"
    ON roids_transactions FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Additional ROIDS Policies
DROP POLICY IF EXISTS "Users can view their own ROIDS balance" ON user_roids;
DROP POLICY IF EXISTS "Service role can manage ROIDS" ON user_roids;

CREATE POLICY "Users can view their own ROIDS balance"
    ON user_roids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage ROIDS"
    ON user_roids FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Product Views Policies
CREATE POLICY "Users can record their own views"
    ON product_views FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own view history"
    ON product_views FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary table permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON support_requests TO authenticated;
GRANT SELECT, UPDATE ON user_roids TO authenticated;