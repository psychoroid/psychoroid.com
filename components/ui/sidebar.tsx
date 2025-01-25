import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/actions/utils"
import { Button } from "./button"

interface SidebarContextValue {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    isMobile: boolean;
    id: string;
}

const SidebarContext = React.createContext<SidebarContextValue>({
    collapsed: false,
    setCollapsed: () => { },
    isMobile: false,
    id: 'default'
})

export function useSidebar() {
    return React.useContext(SidebarContext)
}

interface SidebarProviderProps {
    children: React.ReactNode;
    defaultCollapsed?: boolean;
    id: string;
}

export function SidebarProvider({
    children,
    defaultCollapsed = false,
    id = 'default',
}: SidebarProviderProps) {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile, id }}>
            {children}
        </SidebarContext.Provider>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    collapsible?: "icon" | boolean;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
    ({ className, collapsible, ...props }, ref) => {
        const { collapsed } = useSidebar()

        return (
            <div
                ref={ref}
                style={{
                    width: collapsed ? '60px' : '290px'
                }}
                className={cn(
                    "flex h-full flex-col overflow-hidden bg-background",
                    "transition-[width] duration-300 ease-in-out",
                    className
                )}
                {...props}
            />
        )
    }
)
Sidebar.displayName = "Sidebar"

export function SidebarHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    const { collapsed } = useSidebar()
    return (
        <div className={cn(
            "flex flex-col gap-2",
            !collapsed && "border-b",
            className
        )}>
            {children}
        </div>
    )
}

export function SidebarContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    const { collapsed } = useSidebar()
    return (
        <div className={cn(
            "flex-1 overflow-auto",
            !collapsed && "border-t",
            className
        )}>
            {children}
        </div>
    )
}

export function SidebarFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    const { collapsed } = useSidebar()
    return (
        <div className={cn(
            !collapsed && "border-t",
            className
        )}>
            {children}
        </div>
    )
}

export function SidebarRail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const { collapsed, setCollapsed } = useSidebar()

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
                "absolute inset-y-0 right-0 z-20 w-1 cursor-col-resize transition-colors",
                className
            )}
            {...props}
        />
    )
}

export function SidebarGroup({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    const { collapsed } = useSidebar()
    return (
        <div className={cn(
            !collapsed && "py-2",
            collapsed && "border-none",
            className
        )}>
            {children}
        </div>
    )
}

export function SidebarGroupLabel({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-4 py-2 text-xs font-semibold text-muted-foreground", className)}>
            {children}
        </div>
    )
}

export function SidebarMenu({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("space-y-1", className)}>
            {children}
        </div>
    )
}

export function SidebarMenuItem({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("relative", className)}>
            {children}
        </div>
    )
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: "default" | "lg"
    asChild?: boolean
}

export function SidebarMenuButton({
    className,
    size = "default",
    asChild = false,
    children,
    ...props
}: SidebarMenuButtonProps) {
    const Comp = asChild ? React.Fragment : "button"
    return (
        <Comp
            className={cn(
                "flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent",
                size === "lg" && "py-3",
                className
            )}
            {...props}
        >
            {children}
        </Comp>
    )
}

export function SidebarMenuAction({ className, children, showOnHover }: React.HTMLAttributes<HTMLDivElement> & { showOnHover?: boolean }) {
    return (
        <div className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            showOnHover && "opacity-0 group-hover:opacity-100",
            className
        )}>
            {children}
        </div>
    )
}

export function SidebarMenuSub({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("pl-6 pt-1", className)}>
            {children}
        </div>
    )
}

export function SidebarMenuSubItem({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("relative", className)}>
            {children}
        </div>
    )
}

export function SidebarMenuSubButton({ className, asChild = false, children, ...props }: SidebarMenuButtonProps) {
    const Comp = asChild ? React.Fragment : "button"
    return (
        <Comp
            className={cn(
                "flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
                className
            )}
            {...props}
        >
            {children}
        </Comp>
    )
} 