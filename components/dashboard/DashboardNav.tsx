'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'
import { Box, Settings, Home } from 'lucide-react'
import { motion } from 'framer-motion'

export function DashboardNav() {
    const pathname = usePathname()

    const isSettingsRoute = (path: string) => {
        return path.startsWith('/dashboard/settings')
    }

    const navItems = [
        {
            title: 'Overview',
            href: '/dashboard',
            isActive: pathname === '/dashboard',
            icon: Home,
            color: 'text-[#D73D57]'
        },
        {
            title: 'Assets',
            href: '/dashboard/assets',
            isActive: pathname === '/dashboard/assets',
            icon: Box,
            color: 'text-cyan-500 dark:text-cyan-400'
        },
        {
            title: 'Settings',
            href: '/dashboard/settings',
            isActive: isSettingsRoute(pathname),
            icon: Settings,
            color: 'text-fuchsia-500 dark:text-fuchsia-400'
        }
    ]

    const activeIndex = navItems.findIndex(item => item.isActive)

    return (
        <div className="mb-8">
            <nav className="inline-flex border-b border-border relative">
                <div className="flex space-x-6">
                    {navItems.map((item) => {
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
                        left: `${activeIndex * (100 / navItems.length)}%`,
                        right: `${(navItems.length - 1 - activeIndex) * (100 / navItems.length)}%`
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