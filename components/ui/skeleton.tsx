import { cn } from "@/lib/actions/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-none bg-muted", className)}
            {...props}
        />
    )
}

export { Skeleton } 