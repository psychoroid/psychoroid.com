'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'
import { Box, Settings, Home } from 'lucide-react'

const navItems = [
    {
        title: 'Overview',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />
    },
    {
        title: 'Assets',
        href: '/dashboard/assets',
        icon: <Box className="h-4 w-4" />
    },
    {
        title: 'Settings',
        href: '/dashboard/settings/account',
        icon: <Settings className="h-4 w-4" />
    }
]

export function DashboardNav() {
    const pathname = usePathname()

    return (
        <div className="mb-8">
            <nav className="inline-flex border-b border-border">
                <div className="flex space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-2 py-3 text-sm font-medium border-b transition-colors",
                                pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.icon}
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    )
} 