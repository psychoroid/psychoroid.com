--------------- ROIDS SYSTEM ---------------

-- Create user_roids table to track ROIDS balance
create table user_roids (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) unique not null,
    balance integer default 0 not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint positive_balance check (balance >= 0)
);

-- Create roids_transactions table to track all ROIDS transactions
create table roids_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    amount integer not null,
    transaction_type text not null check (transaction_type in ('purchase', 'usage', 'refund')),
    stripe_session_id text,
    product_id uuid references products(id),
    description text,
    created_at timestamptz default now(),
    constraint valid_amount check (
        (transaction_type = 'purchase' and amount > 0) or
        (transaction_type = 'usage' and amount < 0) or
        (transaction_type = 'refund' and amount > 0)
    )
);

-- Create updated_at trigger function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers for ROIDS tables
create trigger handle_user_roids_updated_at
    before update on user_roids
    for each row execute function public.handle_updated_at();

-- Create function to update user_roids balance
create or replace function update_roids_balance()
returns trigger as $$
begin
    insert into user_roids (user_id, balance)
    values (new.user_id, new.amount)
    on conflict (user_id)
    do update set balance = user_roids.balance + new.amount;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically update user_roids balance
create trigger handle_roids_transaction
    after insert on roids_transactions
    for each row execute function update_roids_balance();

-- Create RLS policies
alter table user_roids enable row level security;
alter table roids_transactions enable row level security;

-- Policies for user_roids
create policy "Users can view their own ROIDS balance"
    on user_roids for select
    using (auth.uid() = user_id);

-- Policies for roids_transactions
create policy "Users can view their own transactions"
    on roids_transactions for select
    using (auth.uid() = user_id);

create policy "System can insert transactions"
    on roids_transactions for insert
    to service_role
    with check (true); 

-- RPC Functions for ROIDS System

-- Function to get user's ROIDS balance
CREATE OR REPLACE FUNCTION get_user_roids_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$;

-- Function to check if user has sufficient ROIDS
CREATE OR REPLACE FUNCTION check_roids_balance(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0) >= p_amount;
END;
$$;

-- Function to record ROIDS transaction
CREATE OR REPLACE FUNCTION record_roids_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_stripe_session_id TEXT DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO roids_transactions (
        user_id,
        amount,
        transaction_type,
        stripe_session_id,
        product_id,
        description
    )
    VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_stripe_session_id,
        p_product_id,
        p_description
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Function to get user's transaction history
CREATE OR REPLACE FUNCTION get_user_roids_transactions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    amount INTEGER,
    transaction_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    stripe_session_id TEXT,
    product_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.amount,
        rt.transaction_type,
        rt.description,
        rt.created_at,
        rt.stripe_session_id,
        rt.product_id
    FROM roids_transactions rt
    WHERE rt.user_id = p_user_id
    ORDER BY rt.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to use ROIDS for asset generation
CREATE OR REPLACE FUNCTION use_roids_for_asset(
    p_user_id UUID,
    p_amount INTEGER,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Check current balance
    SELECT balance INTO v_balance
    FROM user_roids
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF COALESCE(v_balance, 0) < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Record the transaction
    PERFORM record_roids_transaction(
        p_user_id,
        -p_amount,
        'usage',
        NULL,
        p_product_id,
        'Asset generation'
    );
    
    RETURN TRUE;
END;
$$;

-- Add RLS policies for the RPC functions
ALTER FUNCTION get_user_roids_balance(UUID) STABLE;
ALTER FUNCTION check_roids_balance(UUID, INTEGER) STABLE;
ALTER FUNCTION get_user_roids_transactions(UUID, INTEGER, INTEGER) STABLE;

GRANT EXECUTE ON FUNCTION get_user_roids_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_roids_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_roids_transaction(UUID, INTEGER, TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_roids_transactions(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_roids_for_asset(UUID, INTEGER, UUID) TO authenticated; 