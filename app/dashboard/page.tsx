'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Card } from '@/components/ui/card'
import { Coins, Clock, Box } from 'lucide-react'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/supabase'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import RippleButton from '@/components/ui/magic/ripple-button'
import { useTheme } from 'next-themes'

export default function DashboardPage() {
    const { user, lastActivity, roidsBalance, assetsCount, refreshUserData } = useUser()
    const [isLoading, setIsLoading] = useState(true)
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User'
    const { currentLanguage } = useTranslation()
    const router = useRouter()
    const { theme } = useTheme()

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
                    title={t(currentLanguage, 'ui.dashboard.title')}
                    description={t(currentLanguage, 'ui.dashboard.welcome').replace('{firstName}', firstName)}
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
        <div className="flex flex-col space-y-6">
            <div>
                <div className="flex justify-between items-center">
                    <DashboardHeader
                        title={t(currentLanguage, 'ui.dashboard.title')}
                        description={t(currentLanguage, 'ui.dashboard.welcome').replace('{firstName}', firstName)}
                    />
                    <RippleButton
                        onClick={() => router.push('/studio')}
                        className={`rounded-none h-10 px-6 transition-colors
                            ${theme === 'dark'
                                ? 'border-blue-400 text-blue-400 hover:text-blue-400/90 hover:border-blue-400/90'
                                : 'border-[#D73D57] text-[#D73D57] hover:text-[#D73D57]/90 hover:border-[#D73D57]/90'
                            }`}
                        rippleColor={theme === 'dark'
                            ? "rgba(96, 165, 250, 0.1)"  // blue-400 with opacity
                            : "rgba(215, 61, 87, 0.1)"   // #D73D57 with opacity
                        }
                    >
                        Studio
                    </RippleButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <DashboardCard
                        title={t(currentLanguage, 'ui.dashboard.cards.credits.title')}
                        value={roidsBalance ?? '—'}
                        description={t(currentLanguage, 'ui.dashboard.cards.credits.description')}
                        icon={Coins}
                        iconClassName="text-[#D73D57]"
                    />
                    <DashboardCard
                        title={t(currentLanguage, 'ui.dashboard.cards.assets.title')}
                        value={assetsCount ?? '—'}
                        description={t(currentLanguage, 'ui.dashboard.cards.assets.description')}
                        icon={Box}
                        iconClassName="text-cyan-500 dark:text-cyan-400"
                    />
                    <DashboardCard
                        title={t(currentLanguage, 'ui.dashboard.cards.activity.title')}
                        value={lastActivity ? formatTimeAgo(lastActivity, currentLanguage) : '—'}
                        description={t(currentLanguage, 'ui.dashboard.cards.activity.description')}
                        icon={Clock}
                        iconClassName="text-fuchsia-500 dark:text-fuchsia-400"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 rounded-none border-border">
                    <h3 className="text-sm font-medium mb-4">{t(currentLanguage, 'ui.recentActivity.title')}</h3>
                    <RecentActivity />
                </Card>

                <Card className="p-6 rounded-none border-border">
                    <h3 className="text-sm font-medium mb-4">{t(currentLanguage, 'ui.quickActions.title')}</h3>
                    <QuickActions />
                </Card>
            </div>
        </div>
    )
}
// Helper function to format time
function formatTimeAgo(date: string, currentLanguage: string) {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)

    if (diffInMinutes < 5) return t(currentLanguage, 'ui.dashboard.timeAgo.justNow')
    if (diffInMinutes < 60) return t(currentLanguage, 'ui.dashboard.timeAgo.minutesAgo').replace('{minutes}', diffInMinutes.toString())
    if (diffInHours === 1) return t(currentLanguage, 'ui.dashboard.timeAgo.oneHourAgo')
    if (diffInHours < 24) return t(currentLanguage, 'ui.dashboard.timeAgo.hoursAgo').replace('{hours}', diffInHours.toString())
    return t(currentLanguage, 'ui.dashboard.timeAgo.daysAgo').replace('{days}', Math.floor(diffInHours / 24).toString())
}

