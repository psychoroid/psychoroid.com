interface DashboardHeaderProps {
    title: string
    description: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col space-y-1">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">
                {description}
            </p>
        </div>
    )
} 