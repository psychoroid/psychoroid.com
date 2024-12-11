'use client'

import { Button } from '@/components/ui/button'
import {
    Plus,
    Users,
    BookOpen,
    HelpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActions() {
    const router = useRouter()

    const actions = [
        {
            label: 'New Model',
            description: 'Create a new 3D model',
            icon: Plus,
            onClick: () => router.push('/'),
            color: 'text-foreground'
        },
        {
            label: 'Community',
            description: 'Explore public assets',
            icon: Users,
            onClick: () => router.push('/community'),
            color: 'text-purple-500 dark:text-purple-400'
        },
        {
            label: 'Developers',
            description: 'Learn how to leverage our API',
            icon: BookOpen,
            onClick: () => window.open('https://developers.psychoroid.com', '_blank'),
            color: 'text-teal-500 dark:text-teal-400'
        },
        {
            label: 'Support',
            description: 'Get fast assistance on any issues',
            icon: HelpCircle,
            onClick: () => router.push('/dashboard/settings/support'),
            color: 'text-amber-500 dark:text-amber-400'
        }
    ]

    return (
        <div className="flex flex-col space-y-2 h-full">
            {actions.map((action) => (
                <Button
                    key={action.label}
                    variant="outline"
                    className="flex items-center justify-start gap-3 w-full h-16 px-6 group hover:bg-accent rounded-none"
                    onClick={action.onClick}
                >
                    <action.icon
                        className={`h-5 w-5 ${action.color}`}
                    />
                    <div className="flex flex-col items-start">
                        <span className="font-medium">{action.label}</span>
                        <span className="text-xs text-muted-foreground">
                            {action.description}
                        </span>
                    </div>
                </Button>
            ))}
        </div>
    )
} 