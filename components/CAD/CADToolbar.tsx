'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Box,
    Ruler,
    Move3d,
    Combine,
    Scissors,
    RotateCw,
    Scale,
    Grid3x3,
    Layers,
    Download,
    Share2
} from 'lucide-react';

interface Tool {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    shortcut?: string;
}

interface CADToolbarProps {
    onExport: () => void;
    onShare: () => void;
    className?: string;
}

function PureCADToolbar({ onExport, onShare, className }: CADToolbarProps) {
    const tools: Tool[] = [
        {
            icon: <Move3d className="h-4 w-4" />,
            label: 'Move',
            action: () => console.log('Move tool selected'),
            shortcut: 'M'
        },
        {
            icon: <RotateCw className="h-4 w-4" />,
            label: 'Rotate',
            action: () => console.log('Rotate tool selected'),
            shortcut: 'R'
        },
        {
            icon: <Scale className="h-4 w-4" />,
            label: 'Scale',
            action: () => console.log('Scale tool selected'),
            shortcut: 'S'
        },
        {
            icon: <Ruler className="h-4 w-4" />,
            label: 'Measure',
            action: () => console.log('Measure tool selected'),
            shortcut: 'L'
        },
        {
            icon: <Grid3x3 className="h-4 w-4" />,
            label: 'Array',
            action: () => console.log('Array tool selected'),
            shortcut: 'A'
        },
        {
            icon: <Combine className="h-4 w-4" />,
            label: 'Boolean Union',
            action: () => console.log('Union operation selected'),
            shortcut: 'U'
        },
        {
            icon: <Scissors className="h-4 w-4" />,
            label: 'Boolean Difference',
            action: () => console.log('Difference operation selected'),
            shortcut: 'D'
        },
        {
            icon: <Layers className="h-4 w-4" />,
            label: 'Layers',
            action: () => console.log('Layers panel toggled'),
            shortcut: 'L'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col gap-1 p-2 rounded-lg border bg-background shadow-lg ${className}`}
        >
            {tools.map((tool) => (
                <Tooltip key={tool.label}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={tool.action}
                        >
                            {tool.icon}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                        <div className="flex items-center gap-2">
                            <span>{tool.label}</span>
                            {tool.shortcut && (
                                <kbd className="px-2 py-1 text-xs bg-muted rounded-md">
                                    {tool.shortcut}
                                </kbd>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            ))}

            <div className="h-[1px] bg-border my-1" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onExport}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Export Model</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onShare}
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Share Model</TooltipContent>
            </Tooltip>
        </motion.div>
    );
}

export const CADToolbar = memo(PureCADToolbar); 