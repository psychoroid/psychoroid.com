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
    if (typeof window !== 'undefined') {
        try {
            // Clear Supabase specific items
            const supabaseKeys = [
                'supabase.auth.token',
                'supabase.auth.refreshToken',
                'sb-access-token',
                'sb-refresh-token',
                'supabase.auth.expires_at',
                'supabase.auth.expires_in',
                'sb-provider-token',
                'supabase.auth.provider-token',
            ];

            // Clear user specific items
            const userKeys = [
                'user-roids-balance',
                'cached_roids_balance',
                'cachedImages',
                'cachedSelectedImage',
                'theme'
            ];

            // Clear all Supabase related items
            supabaseKeys.forEach(key => {
                try {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                } catch (e) {
                    console.error(`Error clearing ${key}:`, e);
                }
            });

            // Clear all user related items
            userKeys.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`Error clearing ${key}:`, e);
                }
            });

            // Clear any items that start with 'sb-'
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) {
                    localStorage.removeItem(key);
                }
            });

        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    }
}; 