'use client'

import { Button } from '@/components/ui/button'
import {
    Plus,
    Users,
    BookOpen,
    HelpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

export function QuickActions() {
    const router = useRouter()
    const { currentLanguage } = useTranslation()

    const actions = [
        {
            label: t(currentLanguage, 'ui.quickActions.newModel.title'),
            description: t(currentLanguage, 'ui.quickActions.newModel.description'),
            icon: Plus,
            onClick: () => router.push('/'),
            color: 'text-foreground'
        },
        {
            label: t(currentLanguage, 'ui.quickActions.community.title'),
            description: t(currentLanguage, 'ui.quickActions.community.description'),
            icon: Users,
            onClick: () => router.push('/community'),
            color: 'text-purple-500 dark:text-purple-400'
        },
        {
            label: t(currentLanguage, 'ui.quickActions.developers.title'),
            description: t(currentLanguage, 'ui.quickActions.developers.description'),
            icon: BookOpen,
            onClick: () => window.open('https://developers.psychoroid.com', '_blank'),
            color: 'text-[#D73D57]'
        },
        {
            label: t(currentLanguage, 'ui.quickActions.support.title'),
            description: t(currentLanguage, 'ui.quickActions.support.description'),
            icon: HelpCircle,
            onClick: () => router.push('/dashboard/settings/support'),
            color: 'text-cyan-500 dark:text-cyan-400'
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