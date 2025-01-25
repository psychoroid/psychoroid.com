--------------- ENUMS ---------------

CREATE TYPE subscription_type_enum AS ENUM ('free', 'automate', 'scale', 'enterprise');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE transaction_type_enum AS ENUM ('purchase', 'usage', 'refund', 'subscription');
CREATE TYPE visibility_type_enum AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE support_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE feedback_sentiment_enum AS ENUM ('very_positive', 'positive', 'negative', 'very_negative');
CREATE TYPE activity_type_enum AS ENUM (
    'password_reset',
    'email_change',
    'profile_updated',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'api_key_generated',
    'api_key_revoked',
    'visibility_changed'
);
CREATE TYPE api_key_status_enum AS ENUM ('active', 'revoked');
CREATE TYPE view_type_enum AS ENUM ('click', 'scroll', 'page_load');

--------------- TABLES ---------------

-- Profiles table
CREATE TABLE public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    email text,
    username text UNIQUE NOT NULL,
    birthdate date,
    organization text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_username_check CHECK (
        username ~ '^[a-zA-Z0-9_\-]{3,35}$'
    )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

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
    is_featured boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    views_count integer default 0
);

CREATE INDEX idx_products_user_id ON products(user_id);

-- Product Likes table
CREATE TABLE product_likes (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    unique(product_id, user_id)
);

CREATE INDEX idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX idx_product_likes_user_id ON product_likes(user_id);
CREATE INDEX idx_product_likes_composite ON product_likes(product_id, user_id);

-- Product Downloads table
CREATE TABLE product_downloads (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    format text not null,
    created_at timestamptz default now()
);

CREATE INDEX idx_product_downloads_efficient ON product_downloads(product_id, user_id, created_at DESC);

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
    stripe_customer_id text UNIQUE,
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

CREATE INDEX idx_roids_transactions_user_id ON roids_transactions(user_id);
CREATE INDEX idx_roids_transactions_product_id ON roids_transactions(product_id);

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

CREATE INDEX idx_support_requests_user_id ON support_requests(user_id);

-- Feedback table
CREATE TABLE feedback (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    message text not null,
    sentiment feedback_sentiment_enum,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);

CREATE TABLE user_activity (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    activity_type activity_type_enum not null,
    details jsonb,
    product_id uuid references products(id),
    created_at timestamptz default now()
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_product_id ON user_activity(product_id);
CREATE INDEX idx_user_activity_composite ON user_activity(user_id, product_id);

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

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Create user activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type_enum NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);

-- Product Views table
CREATE TABLE product_views (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    view_type view_type_enum NOT NULL,
    created_at timestamptz default now()
);

CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_user_id ON product_views(user_id);
CREATE INDEX idx_product_views_composite ON product_views(product_id, user_id);

-- CAD Chats table
CREATE TABLE cad_chats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    title text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_message_at timestamptz default now(),
    is_archived boolean default false,
    metadata jsonb default '{}'::jsonb
);

CREATE INDEX idx_cad_chats_user_id ON cad_chats(user_id);
CREATE INDEX idx_cad_chats_last_message ON cad_chats(last_message_at DESC);

-- CAD Messages table
CREATE TABLE cad_messages (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid references cad_chats(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    parameters jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb
);

CREATE INDEX idx_cad_messages_chat_id ON cad_messages(chat_id);
CREATE INDEX idx_cad_messages_user_id ON cad_messages(user_id);

-- CAD Models table
CREATE TABLE cad_models (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid references cad_chats(id) on delete cascade,
    message_id uuid references cad_messages(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    model_path text not null,
    preview_path text,
    parameters jsonb not null default '{}'::jsonb,
    format text not null,
    status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb
);

CREATE INDEX idx_cad_models_chat_id ON cad_models(chat_id);
CREATE INDEX idx_cad_models_message_id ON cad_models(message_id);
CREATE INDEX idx_cad_models_user_id ON cad_models(user_id);

-- CAD Operations table
CREATE TABLE cad_operations (
    id uuid primary key default uuid_generate_v4(),
    model_id uuid references cad_models(id) on delete cascade,
    operation_type text not null,
    parameters jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    metadata jsonb default '{}'::jsonb
);

CREATE INDEX idx_cad_operations_model_id ON cad_operations(model_id);