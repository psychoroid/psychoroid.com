'use client';

import { useEffect, useState } from 'react';
import { getUserRoidsBalance } from '@/lib/roids/roids';

export function RoidsBalance({ userId }: { userId: string }) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        async function fetchBalance() {
            try {
                const roidsBalance = await getUserRoidsBalance(userId);
                setBalance(roidsBalance);
            } catch (error) {
                console.error('Error fetching ROIDS balance:', error);
            }
        }

        if (userId) {
            fetchBalance();
        }
    }, [userId]);

    if (balance === null) return null;

    return (
        <div className="text-center p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300">Your ROIDS Balance</h3>
            <p className="text-2xl font-bold text-purple-400">{balance} ROIDS</p>
        </div>
    );
} 