'use client';

import { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { PlusIcon, History, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { cn } from "@/lib/actions/utils";
import { format } from 'date-fns';

interface CADHistoryItem {
    id: string;
    title: string;
    timestamp: Date;
    preview?: string;
    messages?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
}

interface CADSidebarProps {
    user: User | undefined;
    history?: CADHistoryItem[];
    onNewProject?: () => void;
    onHistoryItemClick?: (item: CADHistoryItem) => void;
}

export function CADSidebar({ user, history = [], onNewProject, onHistoryItemClick }: CADSidebarProps) {
    const router = useRouter();

    const handleNewChat = () => {
        if (onNewProject) {
            onNewProject();
        }
        // Clear the current chat and reset parameters
        router.refresh(); // Refresh the page to start fresh
    };

    return (
        <div className="flex h-full w-full flex-col bg-muted/50">
            <div className="flex h-[60px] items-center justify-between px-4 py-2 border-b">
                <span className="text-lg font-semibold">Chat History</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    className="h-8 w-8 hover:bg-primary/10"
                    title="Start new chat"
                >
                    <PlusIcon className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-4">
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onHistoryItemClick?.(item)}
                            className={cn(
                                'w-full flex flex-col gap-2 rounded-lg border bg-background/60 p-4 text-left transition-colors hover:bg-accent',
                                'group/item'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 shrink-0" />
                                <span className="flex-1 text-sm font-medium line-clamp-1">
                                    {item.title}
                                </span>
                            </div>

                            {item.messages && item.messages.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{item.messages.length} messages</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{format(new Date(item.timestamp), 'MMM d, yyyy')}</span>
                                <span>{format(new Date(item.timestamp), 'h:mm a')}</span>
                            </div>

                            {item.preview && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {item.preview}
                                </p>
                            )}
                        </button>
                    ))}

                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <History className="h-8 w-8 mb-4 opacity-50" />
                            <p className="text-sm">No chat history yet</p>
                            <p className="text-xs mt-1">Start a new project to begin</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
} 