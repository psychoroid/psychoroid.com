-- Rename the file from 20240101000023_setup_default_assets.sql to 20240101000024_setup_default_assets.sql
-- Content remains the same

-- Create a bucket for default assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'default-assets', 'default-assets', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'default-assets'
);

-- Create product-models bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'product-models', 'product-models', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-models'
);

-- Set up storage policies for default assets bucket
CREATE POLICY "Public Access to Default Assets"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'default-assets' );

-- Allow service role to manage default assets
CREATE POLICY "Service Role Can Manage Default Assets"
    ON storage.objects FOR ALL
    TO service_role
    USING ( bucket_id = 'default-assets' )
    WITH CHECK ( bucket_id = 'default-assets' ); 