'use client'

import { useUser } from '@/lib/contexts/UserContext'

export default function AssetsPage() {
    const { user } = useUser()

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">My Assets</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your 3D models and images
                </p>
            </div>
            {/* Asset grid will go here */}
        </div>
    )
} 