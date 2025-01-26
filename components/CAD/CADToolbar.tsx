'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Download,
    PlayCircle,
    PauseCircle,
    Focus,
    Crosshair
} from 'lucide-react';
import { cn } from '@/lib/actions/utils';

interface CADToolbarProps {
    onExport?: () => void;
    onZoomModeToggle?: () => void;
    onAutoRotate?: () => void;
    isRotating?: boolean;
    isZoomToCursor?: boolean;
    className?: string;
    activeOperation?: string | undefined;
}

interface ToolItem {
    icon: any;
    label: string;
    action: (() => void) | undefined;
    operation?: string;
    isActive?: boolean;
}

export const CADToolbar = memo(function CADToolbar({
    onExport,
    onZoomModeToggle,
    onAutoRotate,
    isRotating,
    isZoomToCursor,
    className
}: CADToolbarProps) {
    const tools: ToolItem[] = [
        { icon: isRotating ? PauseCircle : PlayCircle, label: isRotating ? 'Stop Auto-Rotate' : 'Auto-Rotate', action: onAutoRotate },
        { icon: isZoomToCursor ? Crosshair : Focus, label: isZoomToCursor ? 'Cursor Zoom' : 'Center Zoom', action: onZoomModeToggle },
        { icon: Download, label: 'Export', action: onExport }
    ];

    return (
        <div className={cn(
            "flex gap-2 p-2 rounded-none relative",
            "bg-transparent backdrop-blur-[2px]",
            "before:absolute before:inset-0 before:border before:border-black/[0.08] dark:before:border-white/[0.08] before:z-[1]",
            "after:absolute after:inset-[0.25px] after:border after:border-black/[0.08] dark:after:border-white/[0.08] after:z-[2]",
            "before:rounded-none after:rounded-none",
            "after:bg-transparent/5 dark:after:bg-transparent/5",
            "before:bg-transparent/5 dark:before:bg-transparent/5",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/[0.02] dark:from-white/[0.02] dark:to-black/5 rounded-none pointer-events-none z-[3]" />

            {/* Single column layout */}
            <div className="relative z-[4] flex flex-col gap-1">
                {tools.map(({ icon: Icon, label, action, operation, isActive }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 rounded-none",
                                    "transition-all duration-200",
                                    isActive && "bg-primary/20 text-primary shadow-sm",
                                    "hover:bg-transparent hover:scale-150",
                                    "focus:ring-0",
                                    "active:scale-95"
                                )}
                                onClick={action}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center" className="text-xs">
                            {label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}); 