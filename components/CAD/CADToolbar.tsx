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
    Plus
} from 'lucide-react';
import { cn } from '@/lib/actions/utils';

interface Tool {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    shortcut?: string;
    operation?: string;
}

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
    className,
    activeOperation
}: CADToolbarProps) {
    const tools = [
        { icon: Move, label: 'Move', action: onMove, operation: 'move' },
        { icon: RotateCw, label: 'Rotate', action: onRotate, operation: 'rotate' },
        { icon: Maximize2, label: 'Scale', action: onScale, operation: 'scale' },
        { icon: Ruler, label: 'Measure', action: onMeasure, operation: 'measure' },
        { icon: Copy, label: 'Array', action: onArray, operation: 'array' },
        { icon: Plus, label: 'Union', action: onUnion, operation: 'union' },
        { icon: Minus, label: 'Difference', action: onDifference, operation: 'difference' },
        { icon: Share2, label: 'Share', action: onShare },
        { icon: Download, label: 'Export', action: onExport }
    ];

    return (
        <div className={cn(
            "flex flex-col gap-2 p-2 rounded-none relative",
            "bg-slate-50/60 dark:bg-zinc-900/50",
            "before:absolute before:inset-0 before:border before:border-black/[0.08] dark:before:border-white/[0.08] before:z-[1]",
            "after:absolute after:inset-[0.25px] after:border after:border-black/[0.08] dark:after:border-white/[0.08] after:z-[2]",
            "before:rounded-none after:rounded-none",
            "after:bg-slate-50/60 dark:after:bg-zinc-900/50",
            "before:bg-slate-50/60 dark:before:bg-zinc-900/50",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none z-[3]" />
            <div className="relative z-[4] flex flex-col gap-2">
                {tools.map(({ icon: Icon, label, action, operation }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={operation && operation === activeOperation ? "default" : "ghost"}
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-none",
                                    operation && operation === activeOperation && "bg-primary text-primary-foreground"
                                )}
                                onClick={action}
                            >
                                <Icon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center">
                            {label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}); 