'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'

const settingsNavItems = [
    {
        title: 'General',
        href: '/dashboard/settings',
    },
    {
        title: 'Account',
        href: '/dashboard/settings/account',
    },
    {
        title: 'Billing',
        href: '/dashboard/settings/billing',
    },
    {
        title: 'Notifications',
        href: '/dashboard/settings/notifications',
    }
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="space-y-6">
            <div className="flex border-b border-border">
                <nav className="flex space-x-8">
                    {settingsNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium leading-6 py-3 border-b-2 -mb-px transition-colors",
                                pathname === item.href
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            {children}
        </div>
    )
} 