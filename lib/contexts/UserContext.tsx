'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/supabase';

interface UserContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    session: null,
    loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <UserContext.Provider value={{
            user: session?.user ?? null,
            session,
            loading
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext); 