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
        <div className={cn("flex flex-col gap-2 p-2", className)}>
            {tools.map(({ icon: Icon, label, action, operation }) => (
                <Tooltip key={label}>
                    <TooltipTrigger asChild>
                        <Button
                            variant={operation && operation === activeOperation ? "default" : "ghost"}
                            size="icon"
                            className={cn(
                                "h-8 w-8",
                                operation && operation === activeOperation && "bg-primary text-primary-foreground"
                            )}
                            onClick={action}
                        >
                            <Icon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {label}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}); 