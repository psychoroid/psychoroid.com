'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/actions/utils'

const navItems = [
    {
        title: 'Overview',
        href: '/dashboard',
    },
    {
        title: 'Assets',
        href: '/dashboard/assets',
    },
    {
        title: 'ROIDS',
        href: '/dashboard/roids',
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
    }
]

export function DashboardNav() {
    const pathname = usePathname()

    return (
        <div className="flex justify-between h-12 mb-8">
            <div className="hidden sm:ml-0 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 transition-colors",
                            {
                                "border-b-2 border-foreground text-foreground": pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname?.startsWith(item.href)),
                            }
                        )}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </div>
    )
} 