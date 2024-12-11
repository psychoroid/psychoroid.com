'use client'

import {
    Plus,
    Heart,
    Download,
    Coins,
    Eye,
    PencilLine,
    History,
    Key,
    CreditCard,
    UserCircle,
    type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/actions/utils'

const activityConfig: Record<string, { icon: LucideIcon; color: string }> = {
    model_created: { icon: Plus, color: 'text-green-500' },
    model_liked: { icon: Heart, color: 'text-red-500' },
    model_downloaded: { icon: Download, color: 'text-blue-500' },
    credits_purchased: { icon: Coins, color: 'text-yellow-500' },
    credits_used: { icon: Coins, color: 'text-orange-500' },
    model_updated: { icon: PencilLine, color: 'text-violet-500' },
    visibility_changed: { icon: Eye, color: 'text-cyan-500' },
    api_key_generated: { icon: Key, color: 'text-emerald-500' },
    api_key_revoked: { icon: Key, color: 'text-rose-500' },
    subscription_updated: { icon: CreditCard, color: 'text-indigo-500' },
    profile_updated: { icon: UserCircle, color: 'text-purple-500' },
    subscription_created: { icon: CreditCard, color: 'text-indigo-500' },
    subscription_cancelled: { icon: CreditCard, color: 'text-gray-500' },
    login: { icon: UserCircle, color: 'text-teal-500' },
    logout: { icon: UserCircle, color: 'text-gray-500' },
    signup: { icon: UserCircle, color: 'text-green-500' },
    password_reset: { icon: Key, color: 'text-amber-500' },
    email_change: { icon: UserCircle, color: 'text-blue-500' },
    empty_state: { icon: History, color: 'text-muted-foreground' }
}

interface ActivityIconProps {
    type: string
    className?: string
}

export function ActivityIcon({ type, className }: ActivityIconProps) {
    const config = activityConfig[type] || { icon: History, color: 'text-gray-500' }
    const Icon = config.icon

    return (
        <Icon
            className={cn(
                "h-4 w-4",
                config.color,
                className
            )}
        />
    )
} 