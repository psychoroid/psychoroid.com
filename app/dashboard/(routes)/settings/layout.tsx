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
        color: 'text-foreground'
    },
    {
        title: 'Billing',
        href: '/dashboard/settings/billing',
        description: 'Manage your subscription and payments',
        icon: CreditCard,
        color: 'text-purple-500 dark:text-purple-400'
    },
    {
        title: 'API',
        href: '/dashboard/settings/api',
        description: 'Integration settings',
        icon: Key,
        color: 'text-[#D73D57]'
    },
    {
        title: 'Support',
        href: '/dashboard/settings/support',
        description: 'Get help and contact us',
        icon: HelpCircle,
        color: 'text-cyan-500 dark:text-cyan-400'
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
            <div className="grid grid-cols-12 gap-4 sm:gap-8">
                <div className="col-span-2 sm:col-span-4">
                    <nav className="space-y-2 sticky top-0">
                        {settingsNavItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center transition-colors relative border-l-2",
                                        // Mobile styles
                                        "h-12 justify-center px-2",
                                        // Desktop styles
                                        "sm:h-[76px] sm:justify-start sm:px-4 sm:py-3 sm:space-x-4",
                                        isActive
                                            ? "text-foreground bg-accent border-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-5 w-5 shrink-0",
                                            "sm:h-6 sm:w-6 sm:mt-0.5",
                                            isActive
                                                ? "text-foreground"
                                                : item.color
                                        )}
                                    />
                                    <div className="hidden sm:block">
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

                <div className="col-span-10 sm:col-span-8">
                    {children}
                </div>
            </div>
        </div>
    )
} 