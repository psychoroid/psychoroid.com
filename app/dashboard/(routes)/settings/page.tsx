'use client'

import { useUser } from '@/lib/contexts/UserContext'

export default function SettingsPage() {
    const { user } = useUser()

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your account settings
                </p>
            </div>
            {/* Settings content will go here */}
        </div>
    )
} 