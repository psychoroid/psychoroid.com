--------------- TABLES ---------------

-- Create products table
create table products (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    name text not null,
    description text,
    image_path text,
    model_path text,
    is_visible boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for products table
create trigger handle_products_updated_at
    before update on products
    for each row execute function public.handle_updated_at();

