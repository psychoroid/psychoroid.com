'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'
import { UserCircle, CreditCard, Key, HelpCircle } from 'lucide-react'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

const settingsNavItems = [
    {
        key: 'account',
        href: '/dashboard/settings/account',
        icon: UserCircle,
        color: 'text-foreground'
    },
    {
        key: 'billing',
        href: '/dashboard/settings/billing',
        icon: CreditCard,
        color: 'text-purple-500 dark:text-purple-400'
    },
    {
        key: 'api',
        href: '/dashboard/settings/api',
        icon: Key,
        color: 'text-[#D73D57]'
    },
    {
        key: 'support',
        href: '/dashboard/settings/support',
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
    const { currentLanguage } = useTranslation()

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
                                        <div className="font-medium">
                                            {t(currentLanguage, `ui.settings.navigation.${item.key}.title`)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {t(currentLanguage, `ui.settings.navigation.${item.key}.description`)}
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