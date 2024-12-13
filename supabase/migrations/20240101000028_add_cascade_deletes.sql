-- Add CASCADE DELETE constraints to all tables referencing auth.users

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS profiles
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE IF EXISTS products
    DROP CONSTRAINT IF EXISTS products_user_id_fkey;

ALTER TABLE IF EXISTS product_likes
    DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;

ALTER TABLE IF EXISTS product_downloads
    DROP CONSTRAINT IF EXISTS product_downloads_user_id_fkey;

ALTER TABLE IF EXISTS user_roids
    DROP CONSTRAINT IF EXISTS user_roids_user_id_fkey;

ALTER TABLE IF EXISTS roids_transactions
    DROP CONSTRAINT IF EXISTS roids_transactions_user_id_fkey;

ALTER TABLE IF EXISTS support_requests
    DROP CONSTRAINT IF EXISTS support_requests_user_id_fkey;

ALTER TABLE IF EXISTS feedback
    DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE IF EXISTS user_activity
    DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE IF EXISTS api_keys
    DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;

ALTER TABLE IF EXISTS user_activities
    DROP CONSTRAINT IF EXISTS user_activities_user_id_fkey;

ALTER TABLE IF EXISTS product_views
    DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;

ALTER TABLE IF EXISTS customers
    DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

-- Recreate foreign key constraints with CASCADE DELETE
ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE products
    ADD CONSTRAINT products_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE product_likes
    ADD CONSTRAINT product_likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE product_downloads
    ADD CONSTRAINT product_downloads_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_roids
    ADD CONSTRAINT user_roids_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE roids_transactions
    ADD CONSTRAINT roids_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE support_requests
    ADD CONSTRAINT support_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE feedback
    ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_activity
    ADD CONSTRAINT user_activity_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE api_keys
    ADD CONSTRAINT api_keys_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_activities
    ADD CONSTRAINT user_activities_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE product_views
    ADD CONSTRAINT product_views_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE customers
    ADD CONSTRAINT customers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes for better delete performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_downloads_user_id ON product_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roids_user_id ON user_roids(user_id);
CREATE INDEX IF NOT EXISTS idx_roids_transactions_user_id ON roids_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id); 