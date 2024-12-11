'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Card } from '@/components/ui/card'
import { Coins, Clock } from 'lucide-react'
import { Box } from 'lucide-react'

import { getUserRoidsBalance } from '@/lib/roids/roids'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
    const { user } = useUser()
    const [roidsBalance, setRoidsBalance] = useState<number | null>(null)
    const [assetsCount, setAssetsCount] = useState<number>(0)
    const [lastActivity, setLastActivity] = useState<string | null>(null)

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User'

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch ROIDS balance
            const balance = await getUserRoidsBalance(user.id)
            setRoidsBalance(balance)

            // Fetch assets count
            const { count: assets } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            setAssetsCount(assets || 0)

            // Fetch last activity
            const { data: activities } = await supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (activities?.[0]) {
                setLastActivity(activities[0].created_at)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        }
    }, [user?.id])

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    return (
        <div
            className="h-full flex flex-col md:overflow-hidden overflow-auto"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingBottom: '4rem',
            }}
        >
            <style jsx global>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="space-y-6 flex-shrink-0">
                <DashboardHeader
                    title="Dashboard"
                    description={`Welcome back ${firstName}!`}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DashboardCard
                        title="Credits"
                        value={roidsBalance ?? '—'}
                        description="Available ROIDS"
                        icon={Coins}
                        iconClassName="text-[#D73D57]"
                    />
                    <DashboardCard
                        title="Assets"
                        value={assetsCount}
                        description="3D models created"
                        icon={Box}
                        iconClassName="text-cyan-500 dark:text-cyan-400"
                    />
                    <DashboardCard
                        title="Activity"
                        value={lastActivity ? formatTimeAgo(lastActivity) : '—'}
                        description="Latest interaction"
                        icon={Clock}
                        iconClassName="text-fuchsia-500 dark:text-fuchsia-400"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 md:h-[370px] min-h-[800px] md:min-h-0">
                <Card className="p-6 rounded-none border-border overflow-hidden flex flex-col h-[400px] md:h-auto">
                    <h3 className="text-sm font-medium mb-4">Recent activity</h3>
                    <div className="flex-1 min-h-0 overflow-auto">
                        <RecentActivity />
                    </div>
                </Card>

                <Card className="p-6 rounded-none border-border overflow-hidden flex flex-col h-[400px] md:h-auto">
                    <h3 className="text-sm font-medium mb-4">Quick actions</h3>
                    <div className="flex-1 min-h-0 overflow-auto">
                        <QuickActions />
                    </div>
                </Card>
            </div>
        </div>
    )
}

// Helper function to format time
function formatTimeAgo(date: string) {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)

    if (diffInMinutes < 5) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
}
