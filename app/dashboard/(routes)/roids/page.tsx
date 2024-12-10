'use client'

import { useUser } from '@/lib/contexts/UserContext'

export default function RoidsPage() {
    const { user } = useUser()

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">ROIDS Balance</h1>
                <p className="text-xs text-muted-foreground">
                    View and manage your credits
                </p>
            </div>
            {/* ROIDS management interface will go here */}
        </div>
    )
} 