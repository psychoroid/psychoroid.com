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
    ChevronsUpDown,
    LogOut,
    Sparkles,
    BadgeCheck,
    Bell,
    PlusIcon,
    Download,
    Box,
    Share2,
    ChevronLeft
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    SidebarMenuAction
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
        <Sidebar
            collapsible="icon"
            className={cn(
                "border-r transition-[width] duration-300 ease-in-out"
            )}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <div className="flex flex-row justify-between items-center p-4">
                        {!collapsed && <span className="text-lg font-semibold">History</span>}
                        <div className={cn("flex items-center gap-2", collapsed && "w-full justify-center")}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/new')}
                                className="h-8 w-8"
                                title="New CAD Generation"
                            >
                                <PlusIcon className="h-4 w-4" />
                            </Button>
                            {!collapsed && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCollapsed(!collapsed)}
                                    className="h-8 w-8"
                                    title="Collapse sidebar"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(false)}
                        className="w-full h-8 flex items-center justify-center hover:bg-accent mb-2"
                        title="Expand sidebar"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}

                {/* Platform Section */}
                <SidebarGroup>
                    {!collapsed && <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-sidebar-foreground/50">Platform</SidebarGroupLabel>}
                    <SidebarMenu className="space-y-2">
                        {mainNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                {collapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Handle navigation here
                                                }}
                                                className="w-full p-2 hover:bg-accent flex justify-center"
                                            >
                                                <item.icon className="h-4 w-4" />
                                            </SidebarMenuButton>
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
                                        className="px-4 py-2 hover:bg-accent group w-full"
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="h-4 w-4 mr-3" />
                                            <span className="text-sm flex-1 text-muted-foreground group-hover:text-foreground">{item.title}</span>
                                            <ChevronRight className="mr-2 h-4 w-4 opacity-50" />
                                        </div>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Previous Chats Section - Only show when not collapsed */}
                {!collapsed && (
                    <SidebarGroup className="mt-6">
                        <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-sidebar-foreground/50">Recent chats</SidebarGroupLabel>
                        <SidebarMenu className="space-y-0.5">
                            {groupedChats.today.length > 0 && (
                                <>
                                    {groupedChats.today.map((chat) => (
                                        <SidebarMenuItem key={chat.id}>
                                            <SidebarMenuButton
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Handle chat click
                                                }}
                                                className="px-4 py-1.5 hover:bg-accent group"
                                            >
                                                <div className="flex items-center">
                                                    <chat.icon className="h-4 w-4 mr-3" />
                                                    <span className="text-sm flex-1 text-muted-foreground group-hover:text-foreground">{chat.title}</span>
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

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                                        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    {!collapsed && (
                                        <>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">{user?.name || 'User'}</span>
                                                <span className="truncate text-xs text-muted-foreground">{user?.email || 'user@example.com'}</span>
                                            </div>
                                            <ChevronsUpDown className="ml-auto h-4 w-4" />
                                        </>
                                    )}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-none">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        <span>Upgrade to Pro</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                        <span>Account Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Bell className="mr-2 h-4 w-4" />
                                        <span>Notifications</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
} 