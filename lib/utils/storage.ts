export const getStorageUrl = (path: string, bucket?: string): string => {
    try {
        if (path.startsWith('http')) return path;

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!baseUrl) throw new Error('Supabase URL not configured');

        if (bucket) {
            const cleanPath = path.replace(`${bucket}/`, '');
            return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
        }

        const parts = path.split('/');
        if (parts.length < 2) throw new Error('Invalid storage path format');

        const pathBucket = parts[0];
        const filePath = parts.slice(1).join('/');

        return `${baseUrl}/storage/v1/object/public/${pathBucket}/${filePath}`;
    } catch (error) {
        console.error('Error generating storage URL:', error);
        return path;
    }
}; 