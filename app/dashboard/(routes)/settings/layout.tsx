'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'
import { UserCircle, CreditCard, Key, HelpCircle } from 'lucide-react'

const settingsNavItems = [
    {
        title: 'Account',
        href: '/dashboard/settings/account',
        description: 'Manage your personal data',
        icon: UserCircle,
        color: 'text-rose-500 dark:text-rose-400'
    },
    {
        title: 'Billing',
        href: '/dashboard/settings/billing',
        description: 'Manage your subscription and payments',
        icon: CreditCard,
        color: 'text-indigo-500 dark:text-indigo-400'
    },
    {
        title: 'API',
        href: '/dashboard/settings/api',
        description: 'Integration settings',
        icon: Key,
        color: 'text-emerald-500 dark:text-emerald-400'
    },
    {
        title: 'Support',
        href: '/dashboard/settings/support',
        description: 'Get help and contact us',
        icon: HelpCircle,
        color: 'text-amber-500 dark:text-amber-400'
    }
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4">
                    <nav className="space-y-2">
                        {settingsNavItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-start space-x-4 px-4 py-3 text-sm transition-colors border-l-2",
                                        pathname === item.href
                                            ? "border-foreground text-foreground bg-accent"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-6 w-6 shrink-0 mt-0.5",
                                            pathname === item.href
                                                ? "text-foreground"
                                                : item.color
                                        )}
                                    />
                                    <div>
                                        <div className="font-medium">{item.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.description}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="col-span-8">
                    {children}
                </div>
            </div>
        </div>
    )
} 