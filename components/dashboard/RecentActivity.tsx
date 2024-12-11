'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityIcon } from '@/components/dashboard/ActivityIcon'

interface Activity {
    id: string
    activity_type: string
    created_at: string
    details: any
    product_id?: string
}

const ITEMS_PER_PAGE = 10
const MAX_PAGES = 20

export function RecentActivity() {
    const { user } = useUser()
    const [activities, setActivities] = useState<Activity[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    const fetchActivities = useCallback(async () => {
        // Get total count first
        const { count } = await supabase
            .from('user_activity')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id)

        setTotalCount(Math.min((count || 0), ITEMS_PER_PAGE * MAX_PAGES))

        // Then get paginated data
        const { data, error } = await supabase
            .from('user_activity')
            .select(`*,
                products (
                    name,
                    image_path
                )`)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

        if (!error && data) {
            setActivities(data)
        }
    }, [user, currentPage])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    const getActivityMessage = (activity: Activity) => {
        const messages = {
            model_created: 'Created new model',
            model_liked: 'Liked a model',
            model_downloaded: 'Downloaded model',
            credits_purchased: `Purchased ${activity.details?.amount || ''} ROIDS`,
            credits_used: `Used ${activity.details?.amount || ''} ROIDS`,
            model_updated: 'Updated model',
            visibility_changed: 'Changed model visibility',
            api_key_generated: 'Generated new API key',
            api_key_revoked: 'Revoked API key',
            subscription_updated: 'Updated subscription',
            profile_updated: 'Updated profile'
        }
        return messages[activity.activity_type as keyof typeof messages] || 'Unknown activity'
    }

    const totalPages = Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), MAX_PAGES)

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ActivityIcon
                    type="empty_state"
                    className="h-8 w-8 text-muted-foreground mb-4"
                />
                <h3 className="text-sm font-medium text-foreground mb-1">No recent activity</h3>
                <p className="text-xs text-muted-foreground">
                    Your activity will appear here
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-2">
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
                <div className="flex justify-center items-center gap-2 pt-4 mt-auto">
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