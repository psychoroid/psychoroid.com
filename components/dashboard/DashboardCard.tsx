import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/actions/utils'

interface DashboardCardProps {
    title: string
    value: string | number
    description: string
    icon: LucideIcon
    iconClassName?: string
    className?: string
}

export function DashboardCard({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
    className
}: DashboardCardProps) {
    return (
        <div className={cn("p-6 border border-border rounded-none", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Icon className={cn("h-8 w-8", iconClassName)} />
            </div>
        </div>
    )
} 