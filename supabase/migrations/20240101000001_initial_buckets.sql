--------------- BUCKETS ---------------

-- Create storage bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public)
select 'product-images', 'product-images', true
where not exists (
    select 1 from storage.buckets where id = 'product-images'
);

-- Set up storage policy for product images bucket
create policy "Public Access to Product Images"
    on storage.objects for select
    using ( bucket_id = 'product-images' );

create policy "Authenticated Users Can Upload Product Images"
    on storage.objects for insert
    with check (
        bucket_id = 'product-images'
        and auth.uid() is not null
    );

create policy "Authenticated Users Can Update Their Own Product Images"
    on storage.objects for update
    using (
        bucket_id = 'product-images'
        and auth.uid() = owner
    );

create policy "Authenticated Users Can Delete Their Own Product Images"
    on storage.objects for delete
    using (
        bucket_id = 'product-images'
        and auth.uid() = owner
    );

-- Create storage bucket for 3D models if it doesn't exist
insert into storage.buckets (id, name, public)
select 'product-models', 'product-models', true
where not exists (
    select 1 from storage.buckets where id = 'product-models'  
);

-- Set up storage policy for product models bucket
create policy "Public Access to Product Models"
    on storage.objects for select
    using ( bucket_id = 'product-models' );

create policy "Authenticated Users Can Upload Product Models"
    on storage.objects for insert
    with check (
        bucket_id = 'product-models'
        and auth.uid() is not null
    );

create policy "Authenticated Users Can Update Their Own Product Models"
    on storage.objects for update
    using (
        bucket_id = 'product-models'
        and auth.uid() = owner
    );

create policy "Authenticated Users Can Delete Their Own Product Models"
    on storage.objects for delete
    using (
        bucket_id = 'product-models'
        and auth.uid() = owner
    );

-- Create storage bucket for support request images if it doesn't exist
insert into storage.buckets (id, name, public)
select 'support-request-images', 'support-request-images', false
where not exists (
    select 1 from storage.buckets where id = 'support-request-images'
);

-- Set up storage policy for support request images bucket
create policy "Authenticated Users Can Upload Support Images"
    on storage.objects for insert
    with check (
        bucket_id = 'support-request-images'
        and auth.uid() is not null
    );

create policy "Users Can Access Their Own Support Images"
    on storage.objects for select
    using (
        bucket_id = 'support-request-images'
        and auth.uid() = owner
    );

create policy "Users Can Update Their Own Support Images"
    on storage.objects for update
    using (
        bucket_id = 'support-request-images'
        and auth.uid() = owner
    );

create policy "Users Can Delete Their Own Support Images"
    on storage.objects for delete
    using (
        bucket_id = 'support-request-images'
        and auth.uid() = owner
    );
