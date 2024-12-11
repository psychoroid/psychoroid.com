-- Drop all storage objects first
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DELETE FROM storage.objects WHERE bucket_id = ''' || id || ''';', ' ')
        FROM storage.buckets
    );
END $$;

-- Drop all buckets
DELETE FROM storage.buckets;

-- Drop all tables
DROP SCHEMA public CASCADE;

-- Recreate the public schema
CREATE SCHEMA public;

-- Grant privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;