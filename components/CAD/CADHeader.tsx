'use client';

import { memo } from 'react';
import { Menu, Download, Settings, Share2, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from "@/lib/actions/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CADHeaderProps {
    onToggleSidebar: () => void;
    selectedModel: string;
    onModelChange: (model: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onShare: () => void;
    onSettings: () => void;
}

function PureCADHeader({
    onToggleSidebar,
    selectedModel,
    onModelChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onShare,
    onSettings
}: CADHeaderProps) {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="h-8 w-8 shrink-0"
            >
                <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={onModelChange}>
                    <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="basic">Basic Shapes</SelectItem>
                        <SelectItem value="advanced">Advanced Shapes</SelectItem>
                        <SelectItem value="architectural">Architectural</SelectItem>
                        <SelectItem value="mechanical">Mechanical Parts</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onUndo}
                                disabled={!canUndo}
                                className="h-8 w-8"
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onRedo}
                                disabled={!canRedo}
                                className="h-8 w-8"
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                    </Tooltip>
                </div>

                <div className="h-4 w-[1px] bg-border" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onExport}
                            className="h-8 w-8"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onShare}
                            className="h-8 w-8"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                </Tooltip>

                <div className="h-4 w-[1px] bg-border" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSettings}
                            className="h-8 w-8"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                </Tooltip>
            </div>
        </header>
    );
}

export const CADHeader = memo(PureCADHeader); 