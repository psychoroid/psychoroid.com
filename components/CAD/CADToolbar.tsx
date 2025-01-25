'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    RotateCw,
    Move,
    Ruler,
    Copy,
    Minus,
    Share2,
    Download,
    Maximize2,
    Plus,
    PlayCircle,
    PauseCircle,
    ZoomIn,
    ZoomOut,
    Focus,
    Crosshair,
    Expand
} from 'lucide-react';
import { cn } from '@/lib/actions/utils';

interface CADToolbarProps {
    onExport?: () => void;
    onShare?: () => void;
    onMove?: () => void;
    onRotate?: () => void;
    onScale?: () => void;
    onMeasure?: () => void;
    onArray?: () => void;
    onUnion?: () => void;
    onDifference?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onExpand?: () => void;
    onZoomModeToggle?: () => void;
    isRotating?: boolean;
    isZoomToCursor?: boolean;
    className?: string;
    activeOperation?: string;
}

export const CADToolbar = memo(function CADToolbar({
    onExport,
    onShare,
    onMove,
    onRotate,
    onScale,
    onMeasure,
    onArray,
    onUnion,
    onDifference,
    onZoomIn,
    onZoomOut,
    onExpand,
    onZoomModeToggle,
    isRotating,
    isZoomToCursor,
    className,
    activeOperation
}: CADToolbarProps) {
    const leftColumnTools = [
        { icon: Move, label: 'Move (Hold Right Click)', action: onMove, operation: 'move' },
        { icon: RotateCw, label: 'Rotate (Hold Left Click)', action: onRotate, operation: 'rotate' },
        { icon: isRotating ? PauseCircle : PlayCircle, label: isRotating ? 'Stop Auto-Rotate' : 'Start Auto-Rotate', action: onRotate },
        { icon: Ruler, label: 'Measure', action: onMeasure, operation: 'measure' },
        { icon: Copy, label: 'Array', action: onArray, operation: 'array' },
    ];

    const rightColumnTools = [
        { icon: ZoomIn, label: 'Zoom In (Scroll Up)', action: onZoomIn },
        { icon: ZoomOut, label: 'Zoom Out (Scroll Down)', action: onZoomOut },
        { icon: isZoomToCursor ? Crosshair : Focus, label: isZoomToCursor ? 'Cursor Zoom' : 'Center Zoom', action: onZoomModeToggle },
        { icon: Plus, label: 'Union', action: onUnion, operation: 'union' },
        { icon: Minus, label: 'Difference', action: onDifference, operation: 'difference' },
        { icon: Expand, label: 'Fit to View', action: onExpand },
        { icon: Download, label: 'Export & Share', action: onExport }
    ];

    return (
        <div className={cn(
            "flex gap-2 p-2 rounded-none relative",
            "bg-slate-50/60 dark:bg-zinc-900/50",
            "before:absolute before:inset-0 before:border before:border-black/[0.08] dark:before:border-white/[0.08] before:z-[1]",
            "after:absolute after:inset-[0.25px] after:border after:border-black/[0.08] dark:after:border-white/[0.08] after:z-[2]",
            "before:rounded-none after:rounded-none",
            "after:bg-slate-50/60 dark:after:bg-zinc-900/50",
            "before:bg-slate-50/60 dark:before:bg-zinc-900/50",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none z-[3]" />

            {/* Two-column layout */}
            <div className="relative z-[4] flex gap-2">
                {/* Left Column */}
                <div className="flex flex-col gap-1 border-r pr-2 border-border/50">
                    {leftColumnTools.map(({ icon: Icon, label, action, operation }) => (
                        <Tooltip key={label}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={operation && operation === activeOperation ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-7 w-7 rounded-none",
                                        "transition-all duration-200",
                                        operation && operation === activeOperation && "bg-primary text-primary-foreground shadow-md",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "active:scale-95",
                                        "focus:ring-1 focus:ring-primary"
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

                {/* Right Column */}
                <div className="flex flex-col gap-1">
                    {rightColumnTools.map(({ icon: Icon, label, action, operation }) => (
                        <Tooltip key={label}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={operation && operation === activeOperation ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-7 w-7 rounded-none",
                                        "transition-all duration-200",
                                        operation && operation === activeOperation && "bg-primary text-primary-foreground shadow-md",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "active:scale-95",
                                        "focus:ring-1 focus:ring-primary"
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
        </div>
    );
}); 