--------------- ENUMS ---------------

CREATE TYPE subscription_type_enum AS ENUM ('free', 'pro', 'intense');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE transaction_type_enum AS ENUM ('purchase', 'usage', 'refund', 'subscription');
CREATE TYPE visibility_type_enum AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE support_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE feedback_sentiment_enum AS ENUM ('very_positive', 'positive', 'negative', 'very_negative');
CREATE TYPE activity_type_enum AS ENUM (
    'login',
    'logout',
    'signup',
    'password_reset',
    'email_change',
    'profile_update',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'api_key_generated',
    'api_key_revoked',
    'visibility_changed'
);
CREATE TYPE api_key_status_enum AS ENUM ('active', 'revoked');

--------------- TABLES ---------------

-- Products table
CREATE TABLE products (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    name text not null,
    description text,
    image_path text,
    model_path text,
    visibility visibility_type_enum default 'public',
    likes_count integer default 0,
    downloads_count integer default 0,
    tags text[],
    is_featured boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Product Likes table
CREATE TABLE product_likes (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    unique(product_id, user_id)
);

-- Product Downloads table
CREATE TABLE product_downloads (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now()
);

-- User and Credits tables
CREATE TABLE user_roids (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) unique not null,
    balance integer default 0 not null,
    subscription_type subscription_type_enum default 'free',
    is_subscribed boolean default false,
    subscription_id text,
    subscription_status subscription_status_enum,
    subscription_period_start timestamptz,
    subscription_period_end timestamptz,
    organization text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint positive_balance check (balance >= 0)
);

-- ROIDS Transactions table
CREATE TABLE roids_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    amount integer not null,
    transaction_type transaction_type_enum not null,
    stripe_session_id text,
    product_id uuid references products(id),
    description text,
    created_at timestamptz default now(),
    constraint valid_amount check (
        (transaction_type = 'purchase' and amount > 0) or
        (transaction_type = 'usage' and amount < 0) or
        (transaction_type = 'refund' and amount > 0) or
        (transaction_type = 'subscription' and amount > 0)
    )
);

-- Support tables
CREATE TABLE support_requests (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    category text not null,
    message text not null,
    image_url text,
    image_path text,
    status support_status_enum default 'open',
    admin_response text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add trigger to clean up storage on request deletion
CREATE OR REPLACE FUNCTION delete_support_request_image()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.image_path IS NOT NULL THEN
        PERFORM delete_storage_object_from_bucket('support-request-images', OLD.image_path);
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cleanup_support_request_image
    BEFORE DELETE ON support_requests
    FOR EACH ROW
    EXECUTE FUNCTION delete_support_request_image();

-- Feedback table
CREATE TABLE feedback (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    message text not null,
    sentiment feedback_sentiment_enum,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE TABLE user_activity (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    activity_type activity_type_enum not null,
    details jsonb,
    product_id uuid references products(id),
    created_at timestamptz default now()
);

-- API Keys table
CREATE TABLE api_keys (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    name text not null,
    key_hash text not null,
    prefix text not null,
    status api_key_status_enum default 'active',
    last_used_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create user activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type_enum NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

--------------- RLS ---------------
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roids ENABLE ROW LEVEL SECURITY;
ALTER TABLE roids_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
