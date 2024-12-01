-- Create users table extension
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
    id uuid references auth.users on delete cascade not null primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    description text,
    image_url text,
    model_url text,
    price decimal(10,2),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.products enable row level security;

-- Create policies
create policy "Users can view their own data." on users
    for select using (auth.uid() = id);

create policy "Users can insert their own data." on users
    for insert with check (auth.uid() = id);

create policy "Users can update their own data." on users
    for update using (auth.uid() = id);

create policy "Anyone can view products." on products
    for select using (true);

create policy "Users can insert their own products." on products
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own products." on products
    for update using (auth.uid() = user_id);

create policy "Users can delete their own products." on products
    for delete using (auth.uid() = user_id); 