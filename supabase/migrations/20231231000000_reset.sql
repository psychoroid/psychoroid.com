-- Drop all storage objects except default assets
DO $$
BEGIN
    -- Handle empty buckets case
    IF EXISTS (SELECT 1 FROM storage.buckets) THEN
        EXECUTE (
            SELECT string_agg(
                'DELETE FROM storage.objects WHERE bucket_id = ''' || id || ''' AND bucket_id != ''default-assets'';',
                ' '
            )
            FROM storage.buckets
            WHERE id IS NOT NULL
        );
    END IF;
END $$;

-- Drop all buckets except default-assets
DELETE FROM storage.buckets WHERE id != 'default-assets';

-- Drop all triggers
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN (
        SELECT 
            tgname as trigger_name,
            relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE;',
            trigger_rec.trigger_name,
            trigger_rec.table_name
        );
    END LOOP;
END $$;

-- Drop schema
DROP SCHEMA IF EXISTS public CASCADE;

-- Recreate the public schema
CREATE SCHEMA public;

-- Grant privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;