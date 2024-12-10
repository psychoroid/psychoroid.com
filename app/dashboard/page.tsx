'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { Card } from '@/components/ui/card'
import { Coins, Image as ImageIcon, Settings } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const { user } = useUser()

    const dashboardItems = [
        {
            title: 'My Assets',
            description: 'Manage your 3D models and images',
            icon: <ImageIcon className="h-5 w-5" />,
            href: '/dashboard/assets'
        },
        {
            title: 'ROIDS Balance',
            description: 'View and manage your credits',
            icon: <Coins className="h-5 w-5" />,
            href: '/dashboard/roids'
        },
        {
            title: 'Settings',
            description: 'Account and preferences',
            icon: <Settings className="h-5 w-5" />,
            href: '/dashboard/settings'
        }
    ]

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                    Welcome back, {user?.user_metadata?.full_name || 'User'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardItems.map((item, index) => (
                    <Link key={index} href={item.href}>
                        <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
