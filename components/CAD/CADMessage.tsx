'use client';

import { memo } from 'react';
import { Box, User, Code, Copy, Check } from 'lucide-react';
import { cn } from "@/lib/actions/utils";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CADMessageProps {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    parameters?: Record<string, any>;
    isLatest?: boolean;
}

function PureCADMessage({ role, content, timestamp, parameters, isLatest }: CADMessageProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <motion.div
            initial={isLatest ? { opacity: 0, y: 10 } : false}
            animate={isLatest ? { opacity: 1, y: 0 } : false}
            className={cn(
                'group relative flex items-start gap-4 p-4 rounded-lg',
                role === 'assistant' ? 'bg-muted/50' : 'bg-primary/5'
            )}
        >
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                role === 'assistant' ? 'bg-primary' : 'bg-secondary'
            )}>
                {role === 'assistant' ? (
                    <Box className="w-4 h-4 text-primary-foreground" />
                ) : (
                    <User className="w-4 h-4 text-secondary-foreground" />
                )}
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                        {role === 'assistant' ? 'CAD Assistant' : 'You'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                        {timestamp.toLocaleTimeString()}
                    </span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {content}
                    </p>
                </div>

                {parameters && (
                    <div className="relative mt-4 bg-muted rounded-md">
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                <span className="text-xs font-medium">Parameters</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(JSON.stringify(parameters, null, 2))}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <ScrollArea className="h-[200px] p-4">
                            <pre className="text-xs">
                                {JSON.stringify(parameters, null, 2)}
                            </pre>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export const CADMessage = memo(PureCADMessage); 