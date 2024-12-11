import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/actions/utils'
import { Card } from '@/components/ui/card'

interface DashboardCardProps {
    title: string
    value: string | number
    description: string
    icon: LucideIcon
    iconClassName?: string
}

export function DashboardCard({
    title,
    value,
    description,
    icon: Icon,
    iconClassName
}: DashboardCardProps) {
    return (
        <Card className="p-6 rounded-none border-border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {title}
                    </p>
                    <h2 className="text-xl font-medium mt-1">
                        {value}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                </div>
                <Icon className={cn("h-5 w-5", iconClassName)} />
            </div>
        </Card>
    )
} 