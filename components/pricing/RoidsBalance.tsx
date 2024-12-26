'use client';

import { useUser } from '@/lib/contexts/UserContext'
import { getUserRoidsBalance } from '@/lib/roids/roids'
import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { cn } from '@/lib/actions/utils';

export function RoidsBalance() {
    const { user } = useUser()
    const [balance, setBalance] = useState<number | null>(null)

    useEffect(() => {
        async function fetchBalance() {
            if (user?.id) {
                const roidsBalance = await getUserRoidsBalance(user.id)
                setBalance(roidsBalance)
            }
        }
        fetchBalance()
    }, [user?.id])

    const getBalanceColor = (balance: number | null) => {
        if (!balance) return 'text-[#D73D57]' // Default red
        if (balance < 500) return 'text-[#D73D57]' // Red for low balance
        if (balance < 1200) return 'text-amber-400' // Amber for medium balance
        return 'text-emerald-400' // Green for high balance
    }

    const balanceColor = getBalanceColor(balance)

    return (
        <div className="flex items-center text-sm font-medium">
            <Coins className={cn("h-4 w-4 mr-2", balanceColor)} />
            <span className={balanceColor}>{balance ?? '—'}</span>
        </div>
    )
} 