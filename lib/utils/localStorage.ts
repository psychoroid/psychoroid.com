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
        'cachedSelectedImage'
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

    // One-time sweep for sb- prefixed items
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith('sb-'))
            .forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.error('Error clearing sb- prefixed items:', e);
    }
}; 