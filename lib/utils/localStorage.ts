export const getLocalStorageItem = (key: string) => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null;
};

export const setLocalStorageItem = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
    }
};

export const removeLocalStorageItem = (key: string) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
};

export const clearAuthState = () => {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
        // Supabase auth keys
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'sb-access-token',
        'sb-refresh-token',
        'supabase.auth.expires_at',
        'supabase.auth.expires_in',
        'sb-provider-token',
        'supabase.auth.provider-token',
        // User data keys
        'user-roids-balance',
        'cached_roids_balance',
        'cachedImages',
        'cachedSelectedImage',
        // Add community-specific keys
        'community_products',
        'last_view_timestamps'
    ];

    // Batch remove known keys
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch (e) {
            // Silently fail for individual items
        }
    });

    // Clear any cached product data
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('product') || key.includes('community')) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.error('Error clearing product cache:', e);
    }
}; 