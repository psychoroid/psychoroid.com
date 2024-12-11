'use client';

import { useUser } from '@/lib/contexts/UserContext'
import { getUserRoidsBalance } from '@/lib/roids/roids'
import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'

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

    return (
        <div className="flex items-center text-sm font-medium">
            <Coins className="h-4 w-4 mr-2 text-[#D73D57]" />
            <span className="text-[#D73D57]">{balance ?? '—'}</span>
        </div>
    )
} 