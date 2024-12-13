'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Card } from '@/components/ui/card'
import { Coins, Clock, Box } from 'lucide-react'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/supabase'

export default function DashboardPage() {
    const { user, lastActivity, roidsBalance, assetsCount, refreshUserData } = useUser()
    const [isLoading, setIsLoading] = useState(true)
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User'

    // Preload activities when dashboard mounts
    useEffect(() => {
        const preloadActivities = async () => {
            if (!user?.id) return

            const cached = localStorage.getItem('recent_activities_cache')
            if (!cached || (Date.now() - JSON.parse(cached).timestamp > 5 * 60 * 1000)) {
                const { data } = await supabase
                    .from('user_activity')
                    .select(`*,
                        products (
                            name,
                            image_path
                        )`)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (data) {
                    localStorage.setItem('recent_activities_cache', JSON.stringify({
                        data,
                        timestamp: Date.now()
                    }))
                }
            }
        }

        preloadActivities()
    }, [user?.id])

    // Initial load optimization
    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // Try to load from cache first
                const cachedData = localStorage.getItem('dashboard_data')
                if (cachedData) {
                    const parsed = JSON.parse(cachedData)
                    // Use cached data if it's less than 5 minutes old
                    if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
                        setIsLoading(false)
                        return
                    }
                }

                await refreshUserData()

                // Cache the new data
                localStorage.setItem('dashboard_data', JSON.stringify({
                    timestamp: Date.now(),
                    lastActivity,
                    roidsBalance,
                    assetsCount
                }))
            } catch (error) {
                console.error('Error loading dashboard:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboard()
    }, [refreshUserData, lastActivity, roidsBalance, assetsCount])

    // Periodic refresh when tab is visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshUserData()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Refresh every minute when visible
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshUserData()
            }
        }, 60000)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            clearInterval(interval)
        }
    }, [refreshUserData])

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in-50">
                <DashboardHeader
                    title="Dashboard"
                    description={`Welcome back ${firstName}!`}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="p-6 space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-24" />
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col md:overflow-hidden overflow-auto pb-16 animate-in fade-in-50">
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
                        value={assetsCount ?? '—'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 flex-1">
                <Card className="p-6 rounded-none border-border overflow-hidden flex flex-col">
                    <h3 className="text-sm font-medium mb-4">Recent activity</h3>
                    <div className="flex-1 overflow-auto">
                        <RecentActivity />
                    </div>
                </Card>

                <Card className="p-6 rounded-none border-border overflow-hidden flex flex-col">
                    <h3 className="text-sm font-medium mb-4">Quick actions</h3>
                    <div className="flex-1 overflow-auto">
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
