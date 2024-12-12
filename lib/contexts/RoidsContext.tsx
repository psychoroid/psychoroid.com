'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '@/lib/utils/localStorage';
import { getUserRoidsBalance } from '@/lib/roids/roids';
import { supabase } from '@/lib/supabase/supabase';

type RoidsContextType = {
    roidsBalance: number | null;
    refreshRoidsBalance: (userId: string) => Promise<void>;
    resetRoidsData: () => void;
};

const RoidsContext = createContext<RoidsContextType>({
    roidsBalance: null,
    refreshRoidsBalance: async () => { },
    resetRoidsData: () => { },
});

export function RoidsProvider({ children }: { children: React.ReactNode }) {
    const [roidsBalance, setRoidsBalance] = useState<number | null>(() => {
        const cached = getLocalStorageItem('cached_roids_balance');
        return cached ? Number(cached) : null;
    });

    const refreshRoidsBalance = useCallback(async (userId: string) => {
        try {
            const balance = await getUserRoidsBalance(userId);
            setRoidsBalance(balance);
            setLocalStorageItem('cached_roids_balance', String(balance));
        } catch (error) {
            console.error('Error refreshing ROIDS balance:', error);
        }
    }, []);

    const resetRoidsData = useCallback(() => {
        setRoidsBalance(null);
        removeLocalStorageItem('cached_roids_balance');
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                resetRoidsData();
            }
        });

        return () => subscription.unsubscribe();
    }, [resetRoidsData]);

    return (
        <RoidsContext.Provider value={{ roidsBalance, refreshRoidsBalance, resetRoidsData }}>
            {children}
        </RoidsContext.Provider>
    );
}

export const useRoids = () => {
    const context = useContext(RoidsContext);
    if (context === undefined) {
        throw new Error('useRoids must be used within a RoidsProvider');
    }
    return context;
}; 