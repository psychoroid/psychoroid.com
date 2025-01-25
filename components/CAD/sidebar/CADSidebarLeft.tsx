'use client';

import * as React from "react";
import { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
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
    ChevronLast
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
import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import Image from 'next/image';
import { UserMenu } from './UserMenu';

interface CADHistoryItem {
    id: string;
    title: string;
    timestamp: Date;
    preview?: string;
}

interface NavItem {
    title: string;
    icon: React.ElementType;
    isActive?: boolean;
    url: string;
}

interface ChatItem {
    id: string;
    title: string;
    createdAt: Date;
    icon: React.ElementType;
    url: string;
}

const mainNavItems: NavItem[] = [
    {
        title: "Library",
        icon: LayoutDashboard,
        isActive: true,
        url: "/library"
    },
    {
        title: "Projects",
        icon: Box,
        url: "/projects"
    },
    {
        title: "Feedback",
        icon: BookOpen,
        url: "/feedback"
    },
];

const previousChats: ChatItem[] = [
    {
        id: "1",
        title: "Engine Block Design",
        createdAt: new Date(),
        icon: FileCode,
        url: "/chat/id/1"
    },
    {
        id: "2",
        title: "Custom Enclosure",
        createdAt: subWeeks(new Date(), 1),
        icon: Boxes,
        url: "/chat/id/2"
    },
    {
        id: "3",
        title: "Bracket Assembly",
        createdAt: subMonths(new Date(), 1),
        icon: Library,
        url: "/chat/id/3"
    }
];

type GroupedChats = {
    today: ChatItem[];
    yesterday: ChatItem[];
    lastWeek: ChatItem[];
    lastMonth: ChatItem[];
    older: ChatItem[];
};

const groupChatsByDate = (chats: ChatItem[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
        (groups, chat) => {
            const chatDate = new Date(chat.createdAt);

            if (isToday(chatDate)) {
                groups.today.push(chat);
            } else if (isYesterday(chatDate)) {
                groups.yesterday.push(chat);
            } else if (chatDate > oneWeekAgo) {
                groups.lastWeek.push(chat);
            } else if (chatDate > oneMonthAgo) {
                groups.lastMonth.push(chat);
            } else {
                groups.older.push(chat);
            }

            return groups;
        },
        {
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: [],
        } as GroupedChats,
    );
};

interface CADSidebarProps {
    user: User | undefined;
    onNewProject?: () => void;
    onHistoryItemClick?: (item: CADHistoryItem) => void;
}

export function CADSidebar({ user, onNewProject, onHistoryItemClick }: CADSidebarProps) {
    const router = useRouter();
    const groupedChats = groupChatsByDate(previousChats);
    const { collapsed, setCollapsed } = useSidebar();

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
                                        onClick={() => router.push('/new')}
                                        className="w-8 h-8 rounded-none flex items-center justify-center"
                                        title="New CAD Generation"
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
                                    onClick={() => router.push('/new')}
                                    className="h-8 w-8 rounded-sm border-[1.5px]"
                                    title="New CAD Generation"
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
                        {!collapsed && <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">Platform</SidebarGroupLabel>}
                        <SidebarMenu className={cn(
                            !collapsed && "space-y-1",
                            collapsed && "space-y-0 divide-y-0"
                        )}>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {collapsed ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="h-10 flex items-center justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // Handle navigation here
                                                        }}
                                                        className="h-8 w-8 rounded-sm hover:border-[1.5px] flex items-center justify-center"
                                                    >
                                                        <item.icon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.title}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <SidebarMenuButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Handle navigation here
                                            }}
                                            className="w-full h-10 px-4 hover:bg-accent group rounded-none"
                                        >
                                            <div className="flex items-center">
                                                <item.icon className="h-4 w-4 mr-2" />
                                                <span className="text-xs flex-1 text-muted-foreground group-hover:text-foreground">{item.title}</span>
                                                <ChevronRight className="h-4 w-4 opacity-50" />
                                            </div>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>

                    {/* Previous Chats Section - Only show when not collapsed */}
                    {!collapsed && (
                        <SidebarGroup className="mt-4">
                            <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">Recent chats</SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                {groupedChats.today.length > 0 && (
                                    <>
                                        {groupedChats.today.map((chat) => (
                                            <SidebarMenuItem key={chat.id}>
                                                <SidebarMenuButton
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        // Handle chat click
                                                    }}
                                                    className="px-4 h-10 hover:bg-accent group rounded-none"
                                                >
                                                    <div className="flex items-center">
                                                        <chat.icon className="h-4 w-4 mr-2" />
                                                        <span className="text-xs flex-1 text-muted-foreground group-hover:text-foreground">{chat.title}</span>
                                                    </div>
                                                </SidebarMenuButton>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <SidebarMenuAction showOnHover>
                                                            <MoreHorizontal className="h-4 w-4 mr-4" />
                                                        </SidebarMenuAction>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-none">
                                                        <DropdownMenuItem>
                                                            <Share2 className="mr-2 h-4 w-4" />
                                                            <span>Share Model</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Star className="mr-2 h-4 w-4" />
                                                            <span>Save Model</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <History className="mr-2 h-4 w-4" />
                                                            <span>View Changes</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            <span>Export CAD</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </SidebarMenuItem>
                                        ))}
                                    </>
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