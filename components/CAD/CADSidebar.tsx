'use client';

import { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlusIcon, History, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { cn } from "@/lib/actions/utils";

interface CADHistoryItem {
    id: string;
    title: string;
    timestamp: Date;
    preview?: string;
}

interface CADSidebarProps {
    user: User | undefined;
    history?: CADHistoryItem[];
    onNewProject?: () => void;
    onHistoryItemClick?: (item: CADHistoryItem) => void;
}

export function CADSidebar({ user, history = [], onNewProject, onHistoryItemClick }: CADSidebarProps) {
    const router = useRouter();

    return (
        <div className="group flex h-full w-full flex-col bg-muted/50">
            <div className="flex h-[60px] items-center justify-between px-4 py-2 border-b">
                <span className="text-lg font-semibold">CAD Projects</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNewProject}
                    className="h-8 w-8"
                >
                    <PlusIcon className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 px-2">
                <div className="space-y-2 p-2">
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onHistoryItemClick?.(item)}
                            className={cn(
                                'flex w-full flex-col items-start gap-2 rounded-lg border bg-background/60 p-3 text-left text-sm transition-colors hover:bg-accent',
                                'group/item'
                            )}
                        >
                            <div className="flex w-full items-center gap-2">
                                <History className="h-4 w-4" />
                                <span className="line-clamp-1 flex-1">{item.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            {item.preview && (
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {item.preview}
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>

            <div className="mt-auto p-4 border-t">
                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name || 'User avatar'}
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                        {user.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                            <div className="ml-auto flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={() => router.push('/auth/sign-in')}
                        >
                            Sign in
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
} 