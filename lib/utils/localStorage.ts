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
        // Auth tokens
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.expires_in');
        
        // User data
        localStorage.removeItem('user-roids-balance');
        localStorage.removeItem('cached_roids_balance');
        
        // Cache data
        localStorage.removeItem('cachedImages');
        localStorage.removeItem('cachedSelectedImage');
        
        // Clear any other app-specific data
        localStorage.removeItem('theme');
        
        // Optional: Clear entire localStorage if you want to be thorough
        // localStorage.clear();
    }
}; 