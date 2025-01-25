'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Undo, RotateCcw, ChevronRight, Lock, Unlock, ChevronLeft } from 'lucide-react';
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/actions/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

interface Parameter {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    locked?: boolean;
}

interface CADParametersProps {
    parameters: Parameter[];
    onChange: (name: string, value: number) => void;
    onReset: () => void;
    onUndo: () => void;
    className?: string;
}

const formatValue = (value: number, unit?: string) => {
    return `${value.toFixed(1)}${unit ? unit : ''}`;
};

function PureCADParameters({ parameters, onChange, onReset, onUndo, className }: Omit<CADParametersProps, 'collapsed' | 'onCollapse'>) {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <Sidebar
            collapsible="icon"
            className={cn(
                "border-l transition-all duration-300 ease-in-out",
                className
            )}
        >
            <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
                <div className="flex items-center gap-2 px-4 w-full">
                    {!collapsed && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(true)}
                                className="h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <h2 className="text-sm font-semibold">Parameters</h2>
                        </>
                    )}
                    {collapsed ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(false)}
                            className="h-8 w-8 mx-auto"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="ml-auto flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={onUndo}
                                    >
                                        <Undo className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Undo Last Change</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={onReset}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reset All Parameters</TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </header>

            {!collapsed && (
                <SidebarContent>
                    <ScrollArea className="h-full">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6 p-4"
                        >
                            {parameters.map((param) => (
                                <motion.div
                                    key={param.name}
                                    className="space-y-2"
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs capitalize flex items-center gap-2">
                                            {param.name.replace(/([A-Z])/g, ' $1').trim()}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 hover:bg-primary/10"
                                                onClick={() => {
                                                    // Toggle lock state
                                                    param.locked = !param.locked;
                                                }}
                                            >
                                                {param.locked ? (
                                                    <Lock className="h-3 w-3" />
                                                ) : (
                                                    <Unlock className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={param.value}
                                            onChange={(e) => !param.locked && onChange(param.name, parseFloat(e.target.value))}
                                            className="w-20 h-7 text-xs"
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            disabled={param.locked}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[param.value]}
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            onValueChange={([value]) => !param.locked && onChange(param.name, value)}
                                            className={cn("flex-1", param.locked && "opacity-50")}
                                            disabled={param.locked}
                                        />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                            {formatValue(param.value, param.unit)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </ScrollArea>
                </SidebarContent>
            )}
        </Sidebar>
    );
}

export const CADParameters = memo(PureCADParameters); 