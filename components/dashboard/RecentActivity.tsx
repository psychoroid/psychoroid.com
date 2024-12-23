'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityIcon } from '@/components/dashboard/ActivityIcon'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface Activity {
    id: string
    activity_type: string
    created_at: string
    details: any
    product_id?: string
}

const ITEMS_PER_PAGE = 4
const MAX_PAGES = 20
const CACHE_KEY = 'recent_activities_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function RecentActivity() {
    const { user } = useUser()
    const [activities, setActivities] = useState<Activity[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached)
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        return data
                    }
                }
            } catch (error) {
                console.error('Error reading cache:', error)
            }
        }
        return []
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const { currentLanguage } = useTranslation()

    const fetchActivities = useCallback(async () => {
        if (!user?.id) return

        try {
            const [countResponse, dataResponse] = await Promise.all([
                supabase
                    .from('user_activity')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),

                supabase
                    .from('user_activity')
                    .select(`*,
                        products (
                            name,
                            image_path
                        )`)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
            ])

            const count = countResponse.count || 0
            setTotalCount(Math.min(count, ITEMS_PER_PAGE * MAX_PAGES))

            if (dataResponse.data) {
                setActivities(dataResponse.data)
                // Cache the results
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: dataResponse.data,
                    timestamp: Date.now()
                }))
            }
        } catch (error) {
            console.error('Error fetching activities:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.id, currentPage])

    useEffect(() => {
        fetchActivities()

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchActivities()
            }
        }, 30000)

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchActivities()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [fetchActivities])

    // Loading skeleton
    if (isLoading && activities.length === 0) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 w-full h-[49px] px-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Empty state
    if (!isLoading && activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ActivityIcon
                    type="empty_state"
                    className="h-8 w-8 text-muted-foreground mb-4"
                />
                <h3 className="text-sm font-medium text-foreground mb-1">
                    {t(currentLanguage, 'ui.recentActivity.empty.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {t(currentLanguage, 'ui.recentActivity.empty.description')}
                </p>
            </div>
        )
    }

    const getActivityMessage = (activity: Activity) => {
        const messages = {
            model_created: t(currentLanguage, 'ui.recentActivity.actions.modelCreated'),
            model_liked: t(currentLanguage, 'ui.recentActivity.actions.modelLiked'),
            model_downloaded: t(currentLanguage, 'ui.recentActivity.actions.modelDownloaded'),
            credits_purchased: t(currentLanguage, 'ui.recentActivity.actions.creditsPurchased').replace('{amount}', activity.details?.amount || ''),
            credits_used: t(currentLanguage, 'ui.recentActivity.actions.creditsUsed').replace('{amount}', activity.details?.amount || ''),
            model_updated: t(currentLanguage, 'ui.recentActivity.actions.modelUpdated'),
            visibility_changed: t(currentLanguage, 'ui.recentActivity.actions.visibilityChanged'),
            api_key_generated: t(currentLanguage, 'ui.recentActivity.actions.apiKeyGenerated'),
            api_key_revoked: t(currentLanguage, 'ui.recentActivity.actions.apiKeyRevoked'),
            subscription_updated: t(currentLanguage, 'ui.recentActivity.actions.subscriptionUpdated'),
            profile_updated: t(currentLanguage, 'ui.recentActivity.actions.profileUpdated')
        }
        return messages[activity.activity_type as keyof typeof messages] || 'Unknown activity'
    }

    const totalPages = Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), MAX_PAGES)

    return (
        <div className="flex flex-col">
            <div className="space-y-2">
                {activities.map((activity) => (
                    <Button
                        key={activity.id}
                        variant="outline"
                        className="flex items-center justify-start gap-3 w-full h-[49px] px-4 group hover:bg-accent rounded-none"
                    >
                        <ActivityIcon
                            type={activity.activity_type}
                            className="group-hover:brightness-110 transition-all"
                        />
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-medium">
                                {getActivityMessage(activity)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), {
                                    addSuffix: true,
                                    includeSeconds: true
                                }).replace('about ', '')}
                            </span>
                        </div>
                    </Button>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
} 