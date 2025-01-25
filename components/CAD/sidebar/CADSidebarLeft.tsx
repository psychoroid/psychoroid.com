'use client';

import * as React from "react";
import { User } from 'next-auth';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Library,
    History,
    Star,
    FileCode,
    Boxes,
    BookOpen,
    MoreHorizontal,
    ChevronRight,
    PlusIcon,
    Download,
    Box,
    Share2,
    ChevronFirst,
    ChevronLast,
    Pencil,
    Archive,
    MessageSquareHeart,
    HeartHandshake,
    Zap,
    Box as Box3D,
    Square,
    Circle,
    Cylinder as CylinderIcon,
    Triangle,
    Shapes
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenuAction,
    SidebarRail
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/actions/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import Image from 'next/image';
import { UserMenu } from './UserMenu';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '@/components/design/loader';

export interface ChatHistoryItem {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
    last_message: string;
    metadata: any;
    is_archived: boolean;
    is_favorite: boolean;
}

interface NavItem {
    title: string;
    icon: React.ElementType;
    isActive?: boolean;
    url?: string;
    subItems?: NavItem[];
}

// Update mainNavItems to remove url from Feedback
const mainNavItems: NavItem[] = [
    {
        title: "Feedback",
        icon: Zap,
        subItems: [
            {
                title: "Give us a review",
                icon: HeartHandshake,
                url: "/feedback/review"
            },
            {
                title: "Support request",
                icon: MessageSquareHeart,
                url: "/feedback/support"
            }
        ]
    }
];

interface CADSidebarProps {
    user: User | undefined;
    onNewProject?: () => Promise<ChatHistoryItem>;
    onHistoryItemClick?: (item: ChatHistoryItem) => void;
}

// Add this CSS at the top of the file after imports
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = scrollbarHideStyles;
    document.head.appendChild(style);
}

export function CADSidebar({ user, onNewProject, onHistoryItemClick }: CADSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const { collapsed, setCollapsed } = useSidebar();
    const [limit, setLimit] = useState(20);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Add toggle function
    const toggleExpanded = useCallback((title: string) => {
        setExpandedItems(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    }, []);

    // Fetch chat history
    useEffect(() => {
        async function fetchChatHistory() {
            try {
                const { data, error } = await supabase
                    .rpc('get_cad_chat_history_v2', { p_limit: 100 });

                if (error) {
                    console.error('Error fetching chat history:', error);
                    return;
                }

                setChatHistory(data || []);
            } catch (error) {
                console.error('Error in chat history fetch:', error);
            }
        }

        if (user) {
            fetchChatHistory();
        }
    }, [user]);

    // Handle chat selection
    const handleChatSelect = useCallback((chat: ChatHistoryItem) => {
        // Navigate to the chat while preserving the username in the URL
        const username = pathname.split('/')[2]; // Get username from /cad/[username]
        router.push(`/cad/${username}?chat=${chat.id}`);

        if (onHistoryItemClick) {
            onHistoryItemClick(chat);
        }
    }, [router, pathname, onHistoryItemClick]);

    const handleNewChat = useCallback(async () => {
        if (!user) return;
        try {
            // Create new chat and let page handle loading
            await onNewProject?.();
        } catch (error) {
            console.error('Error creating new chat:', error);
            toast.error('Failed to create new chat');
        }
    }, [user, onNewProject]);

    const handleRenameChat = async (chatId: string, newTitle: string) => {
        try {
            const { error } = await supabase
                .rpc('rename_cad_chat', { p_chat_id: chatId, p_title: newTitle });

            if (error) throw error;

            // Update local state
            setChatHistory(prev => prev.map(chat =>
                chat.id === chatId ? { ...chat, title: newTitle } : chat
            ));

            toast.success('Chat renamed successfully');
        } catch (error) {
            console.error('Error renaming chat:', error);
            toast.error('Failed to rename chat');
        }
    };

    const handleToggleFavorite = async (chatId: string, isFavorite: boolean) => {
        try {
            const { error } = await supabase
                .rpc('toggle_cad_chat_favorite', { p_chat_id: chatId, p_is_favorite: !isFavorite });

            if (error) throw error;

            // Update local state
            setChatHistory(prev => prev.map(chat =>
                chat.id === chatId ? { ...chat, is_favorite: !isFavorite } : chat
            ));

            toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorite status');
        }
    };

    const handleArchiveChat = async (chatId: string, isArchived: boolean) => {
        try {
            const { error } = await supabase
                .rpc('toggle_cad_chat_archive', { p_chat_id: chatId, p_is_archived: !isArchived });

            if (error) throw error;

            // Update local state
            setChatHistory(prev => prev.map(chat =>
                chat.id === chatId ? { ...chat, is_archived: !isArchived } : chat
            ));

            toast.success(isArchived ? 'Chat restored' : 'Chat archived');
        } catch (error) {
            console.error('Error archiving chat:', error);
            toast.error('Failed to update archive status');
        }
    };

    // Add this function to get the appropriate icon based on metadata
    const getChatIcon = (chat: ChatHistoryItem) => {
        // You can customize this logic based on your metadata structure
        const type = chat.metadata?.type || 'default';
        const icons = {
            'cube': Square,
            'sphere': Circle,
            'cylinder': CylinderIcon,
            'cone': Triangle,
            'box': Box3D,
            'shapes': Shapes,
            'default': FileCode,
        };

        return icons[type as keyof typeof icons] || FileCode;
    };

    // Render chat item with animation
    const ChatItem = ({ chat }: { chat: ChatHistoryItem }) => (
        <div className="relative group">
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => handleChatSelect(chat)}
                    className={cn(
                        "px-4 h-10 hover:bg-transparent transition-colors",
                        searchParams.get('chat') === chat.id && "bg-transparent"
                    )}
                >
                    <div className="flex items-center">
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full mr-2 transition-colors",
                            "bg-muted-foreground/30 group-hover:bg-foreground/50",
                            searchParams.get('chat') === chat.id && "bg-foreground"
                        )} />
                        <span className={cn(
                            "text-xs flex-1 text-muted-foreground group-hover:text-foreground transition-colors truncate",
                            searchParams.get('chat') === chat.id && "text-foreground font-medium"
                        )}>
                            {chat.title}
                        </span>
                        {chat.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 mr-2" />
                        )}
                    </div>
                </SidebarMenuButton>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuAction className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4 mr-4" />
                        </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-none">
                        <DropdownMenuItem onClick={() => handleToggleFavorite(chat.id, chat.is_favorite)}>
                            <Star className="mr-2 h-4 w-4" />
                            <span>{chat.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const newTitle = prompt('Enter new title:', chat.title);
                            if (newTitle && newTitle !== chat.title) {
                                handleRenameChat(chat.id, newTitle);
                            }
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveChat(chat.id, chat.is_archived)}>
                            <Archive className="mr-2 h-4 w-4" />
                            <span>{chat.is_archived ? 'Restore' : 'Archive'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </div>
    )

    return (
        <div className="relative h-full flex">
            <Sidebar
                collapsible="icon"
                className={cn(
                    "border-r transition-[width] duration-300 ease-in-out"
                )}
            >
                <SidebarHeader>
                    <SidebarMenu className="p-0">
                        {collapsed && <div className="h-1" />} {/* Spacing above logo in collapsed view */}
                        <div className={cn(
                            "flex flex-row justify-between items-center",
                            !collapsed ? "ml-4 mr-2 mt-4 mb-4 h-6" : "h-10"
                        )}>
                            <button
                                onClick={() => router.push('/')}
                                className={cn(
                                    "focus:outline-none",
                                    collapsed && "w-full flex justify-center"
                                )}
                            >
                                <Image
                                    src="/psychoroid.png"
                                    alt="Logo"
                                    width={33}
                                    height={33}
                                    className={cn(
                                        "rounded-sm",
                                        !collapsed && "mr-2 mt-1 mb-1"
                                    )}
                                />
                            </button>
                            {!collapsed && (
                                <div className="flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNewChat}
                                        className="w-8 h-8 rounded-none flex items-center justify-center"
                                        title="a new chat"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                    <Separator
                                        orientation="vertical"
                                        className="h-8 cursor-pointer hover:bg-accent/50 transition-colors"
                                        onClick={() => setCollapsed(!collapsed)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setCollapsed(!collapsed)}
                                        className="h-8 w-8 rounded-none"
                                        title="Collapse sidebar"
                                    >
                                        <ChevronFirst className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        {collapsed && (
                            <div className="h-10 flex items-center justify-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleNewChat}
                                    className="h-8 w-8 rounded-sm border-[1.5px]"
                                    title="a new chat"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className={cn(
                    "p-0",
                    collapsed && "!border-t-0 !border-none"
                )}>
                    {/* Platform Section */}
                    <SidebarGroup className={cn(
                        "py-0",
                        collapsed && "!border-t-0 !border-none"
                    )}>
                        {!collapsed && (
                            <div className="flex items-center gap-2 px-4 py-2">
                                <h3 className="text-xs font-medium text-muted-foreground capitalize">Platform</h3>
                                <Separator className="flex-1" />
                            </div>
                        )}
                        <SidebarMenu className={cn(
                            !collapsed && "space-y-1",
                            collapsed && "space-y-0 divide-y-0"
                        )}>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {!collapsed ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                className="w-full h-10 px-4 transition-colors flex items-center hover:bg-transparent"
                                                onClick={() => toggleExpanded(item.title)}
                                            >
                                                <item.icon className="h-4 w-4 mr-2" />
                                                <span className="text-xs flex-1 text-muted-foreground hover:text-foreground transition-colors text-left">{item.title}</span>
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 opacity-50 transition-transform duration-200",
                                                    expandedItems.includes(item.title) && "transform rotate-90"
                                                )} />
                                            </Button>
                                            <AnimatePresence initial={false}>
                                                {expandedItems.includes(item.title) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {item.subItems?.map((subItem) => (
                                                            <Button
                                                                key={subItem.title}
                                                                variant="ghost"
                                                                className="w-full h-10 pl-8 hover:bg-transparent transition-colors flex items-center"
                                                                onClick={() => router.push(subItem.url || '')}
                                                            >
                                                                <subItem.icon className="h-4 w-4 mr-2" />
                                                                <span className="text-xs flex-1 text-muted-foreground hover:text-foreground transition-colors text-left">{subItem.title}</span>
                                                            </Button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-sm hover:bg-transparent transition-colors flex items-center justify-center mx-auto"
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.title}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>

                    {/* Previous Chats Section - Only show when not collapsed */}
                    {!collapsed && (
                        <SidebarGroup className="mt-4">
                            <div className="flex items-center gap-2 px-4 py-2">
                                <h3 className="text-xs font-medium text-muted-foreground capitalize">Recent chats</h3>
                                <Separator className="flex-1" />
                            </div>
                            <SidebarMenu className="space-y-1 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                                {chatHistory.slice(0, limit).map((chat) => (
                                    <ChatItem key={chat.id} chat={chat} />
                                ))}
                                {chatHistory.length > limit && (
                                    <SidebarMenuItem>
                                        <button
                                            onClick={() => setLimit(prev => prev + 20)}
                                            className="px-4 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                                        >
                                            View more
                                        </button>
                                    </SidebarMenuItem>
                                )}
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarFooter className={cn(
                    collapsed && "border-t-0"
                )}>
                    {collapsed && (
                        <div className="w-full h-10 flex items-center justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(false)}
                                className="h-8 w-8 rounded-sm hover:border-[1.5px] flex items-center justify-center focus:bg-transparent hover:bg-transparent"
                                title="Expand sidebar"
                            >
                                <ChevronLast className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <UserMenu user={user} collapsed={collapsed} />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarRail className="border-r border-border" />
        </div>
    );
} 