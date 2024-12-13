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

    const fetchUserData = async (userId: string) => {
        try {
            const { data, error } = await supabase.rpc('get_user_dashboard_data', {
                p_user_id: userId
            })

            if (error) throw error

            if (data && data.length > 0) {
                setLastActivity(data[0].last_activity)
                setRoidsBalance(data[0].roids_balance)
                setAssetsCount(data[0].assets_count)
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }

    const refreshUserData = useCallback(async () => {
        if (session?.user?.id) {
            await fetchUserData(session.user.id);
        }
    }, [session?.user?.id]);

    const signOut = async () => {
        try {
            // First clear all states
            setUser(null);
            setSession(null);
            setLastActivity(null);
            setRoidsBalance(null);
            setAssetsCount(null);

            // Then sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Clear any remaining auth state
            clearAuthState();

            return Promise.resolve();
        } catch (error) {
            console.error('Error signing out:', error);
            return Promise.reject(error);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchUserData(session.user.id);
            } else {
                setRoidsBalance(null);
                setAssetsCount(null);
                setLastActivity(null);
            }

            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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