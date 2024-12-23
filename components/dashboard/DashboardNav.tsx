'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'
import { Box, Settings, Home, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

export function DashboardNav() {
    const { currentLanguage } = useTranslation()
    const pathname = usePathname()

    const items = [
        {
            title: t(currentLanguage, 'ui.dashboard.navigation.overview'),
            href: '/dashboard',
            icon: LayoutDashboard,
            isActive: pathname === '/dashboard',
            color: 'text-[#D73D57]'
        },
        {
            title: t(currentLanguage, 'ui.dashboard.navigation.assets'),
            href: '/dashboard/assets',
            icon: Box,
            isActive: pathname === '/dashboard/assets',
            color: 'text-cyan-500 dark:text-cyan-400'
        },
        {
            title: t(currentLanguage, 'ui.dashboard.navigation.settings'),
            href: '/dashboard/settings',
            icon: Settings,
            isActive: pathname.startsWith('/dashboard/settings'),
            color: 'text-fuchsia-500 dark:text-fuchsia-400'
        }
    ]

    const activeIndex = items.findIndex(item => item.isActive)

    return (
        <div className="mb-8">
            <nav className="inline-flex border-b border-border relative">
                <div className="flex space-x-6">
                    {items.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-2 py-3 text-sm font-medium transition-colors relative",
                                    item.isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", item.color)} />
                                <span>{item.title}</span>
                            </Link>
                        )
                    })}
                </div>
                <motion.div
                    className="absolute bottom-0 h-[2px] bg-foreground"
                    initial={false}
                    animate={{
                        left: `${activeIndex * (100 / items.length)}%`,
                        right: `${(items.length - 1 - activeIndex) * (100 / items.length)}%`
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                />
            </nav>
        </div>
    )
} 