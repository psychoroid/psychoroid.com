'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/supabase';
import { clearAuthState } from '@/lib/utils/localStorage';

export type UserContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    lastActivity: string | null;
    roidsBalance: number | null;
    assetsCount: number | null;
    signOut: () => Promise<void>;
    refreshUserData: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
    user: null,
    session: null,
    isLoading: true,
    lastActivity: null,
    roidsBalance: null,
    assetsCount: null,
    signOut: async () => { },
    refreshUserData: async () => { }
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [lastActivity, setLastActivity] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [roidsBalance, setRoidsBalance] = useState<number | null>(null);
    const [assetsCount, setAssetsCount] = useState<number | null>(null);

    const fetchUserData = useCallback(async (userId: string) => {
        if (!userId) return;

        try {
            const { data, error } = await supabase.rpc('get_user_dashboard_data', {
                p_user_id: userId
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setLastActivity(data[0].last_activity);
                setRoidsBalance(data[0].roids_balance);
                setAssetsCount(data[0].assets_count);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, []);

    // Single useEffect for auth state management
    useEffect(() => {
        let mounted = true;

        // Get initial session without triggering unnecessary fetches
        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (!mounted) return;

                if (initialSession?.user) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    // Only fetch user data if we have a valid session
                    await fetchUserData(initialSession.user.id);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initSession();

        // Auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return;

            // Handle auth state changes
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
                setLastActivity(null);
                setRoidsBalance(null);
                setAssetsCount(null);
                clearAuthState();
            } else if (newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
                fetchUserData(newSession.user.id);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserData]);

    const refreshUserData = useCallback(async () => {
        if (!session?.user?.id) return;
        await fetchUserData(session.user.id);
    }, [session?.user?.id, fetchUserData]);

    const signOut = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // State cleanup will be handled by the auth state change listener
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            session,
            isLoading,
            lastActivity,
            roidsBalance,
            assetsCount,
            signOut,
            refreshUserData
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 