--------------- ENUMS ---------------

CREATE TYPE subscription_type_enum AS ENUM ('free', 'pro', 'intense');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE transaction_type_enum AS ENUM ('purchase', 'usage', 'refund', 'subscription');
CREATE TYPE visibility_type_enum AS ENUM ('public', 'private', 'unlisted');

--------------- TABLES ---------------

-- Create products table with enhanced community features
create table products (
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

-- Create product_likes table for tracking likes
create table product_likes (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    unique(product_id, user_id)
);

-- Create product_downloads table for tracking downloads
create table product_downloads (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now()
);

-- Create user_roids table to track ROIDS balance and subscriptions
create table user_roids (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) unique not null,
    balance integer default 0 not null,
    subscription_type subscription_type_enum default 'free',
    is_subscribed boolean default false,
    subscription_id text,
    subscription_status subscription_status_enum,
    subscription_period_start timestamptz,
    subscription_period_end timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint positive_balance check (balance >= 0)
);

-- Create roids_transactions table to track all ROIDS transactions
create table roids_transactions (
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

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers for all tables
create trigger handle_products_updated_at
    before update on products
    for each row execute function public.handle_updated_at();

create trigger handle_user_roids_updated_at
    before update on user_roids
    for each row execute function public.handle_updated_at();

create trigger handle_roids_transactions_updated_at
    before update on roids_transactions
    for each row execute function public.handle_updated_at();

-- Add after table creation

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roids ENABLE ROW LEVEL SECURITY;
ALTER TABLE roids_transactions ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Public products are viewable by everyone" 
    ON products FOR SELECT 
    USING (visibility = 'public');

CREATE POLICY "Users can view their own products" 
    ON products FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" 
    ON products FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
    ON products FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
    ON products FOR DELETE 
    USING (auth.uid() = user_id);

-- Product likes policies
CREATE POLICY "Anyone can view likes"
    ON product_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like products"
    ON product_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike (delete) their own likes"
    ON product_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Product downloads policies
CREATE POLICY "Anyone can view download counts"
    ON product_downloads FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can record downloads"
    ON product_downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User_roids policies
CREATE POLICY "Users can view their own ROIDS"
    ON user_roids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ROIDS"
    ON user_roids FOR UPDATE
    USING (auth.uid() = user_id);

-- Roids_transactions policies
CREATE POLICY "Users can view their own transactions"
    ON roids_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions"
    ON roids_transactions 
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Product likes policies
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

-- Enable RLS on product_likes if not already enabled
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;