'use client';

import { User } from 'next-auth';
import { ChevronsUpDown, LogOut, Settings, CreditCard, Languages, Monitor, Moon, Sun, Coins, Archive } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/actions/utils";
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { useUser } from '@/lib/contexts/UserContext';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { languages } from '@/lib/i18n/config';
import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase';

interface UserMenuProps {
    user: User | undefined;
    collapsed?: boolean;
}

// Extend the User type to include the properties we need
interface ExtendedUser extends User {
    user_metadata?: {
        avatar_url?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        roids_balance?: number;
    };
    image?: string;
}

const AvatarComponent = memo(({ avatarUrl, userEmail, displayName }: {
    avatarUrl: string | null | undefined,
    userEmail: string | null | undefined,
    displayName: string | null | undefined
}) => (
    <Avatar className="h-8 w-8 rounded-sm">
        {avatarUrl ? (
            <AvatarImage
                src={avatarUrl}
                alt={userEmail || ''}
                className="h-full w-full rounded-sm object-cover"
                loading="eager"
            />
        ) : (
            <AvatarImage
                src={`https://avatar.vercel.sh/${encodeURIComponent(userEmail?.toLowerCase() || '')}?rounded=true`}
                alt="Generated avatar"
                className="h-full w-full rounded-sm object-cover"
                loading="eager"
            />
        )}
        <AvatarFallback className="rounded-sm">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
    </Avatar>
));

AvatarComponent.displayName = 'AvatarComponent';

export const UserMenu = memo(function UserMenu({ user, collapsed }: UserMenuProps) {
    const { currentLanguage, setLanguage } = useTranslation();
    const { user: dbUser, signOut, roidsBalance } = useUser();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [showArchive, setShowArchive] = useState(false);
    const [archivedChats, setArchivedChats] = useState<any[]>([]);

    // Memoize user metadata calculations
    const {
        avatarUrl,
        displayName,
        userEmail,
        firstName,
        lastName,
        username,
        metadata
    } = useMemo(() => {
        const extendedUser = dbUser as ExtendedUser;
        const metadata = extendedUser?.user_metadata || {};
        return {
            avatarUrl: metadata.avatar_url || extendedUser?.image || user?.image,
            firstName: metadata.first_name,
            lastName: metadata.last_name,
            username: metadata.username,
            displayName: metadata.username || (metadata.first_name && metadata.last_name ? `${metadata.first_name} ${metadata.last_name}` : user?.email?.split('@')[0]),
            userEmail: extendedUser?.email || user?.email,
            metadata
        };
    }, [dbUser, user]);

    const handleSignOut = useCallback(async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, [signOut, router]);

    const currentLangName = useMemo(() =>
        languages.find(l => l.code === currentLanguage)?.name,
        [currentLanguage]
    );

    const handleLanguageClick = useCallback(() => {
        const currentIndex = languages.findIndex(l => l.code === currentLanguage);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguage(languages[nextIndex].code);
    }, [currentLanguage, setLanguage]);

    // Function to fetch archived chats
    const fetchArchivedChats = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_archived_chats');

            if (error) throw error;
            setArchivedChats(data || []);
        } catch (error) {
            console.error('Error fetching archived chats:', error);
            toast.error('Failed to load archived chats');
        }
    }, []);

    // Function to restore chat from archive
    const handleRestoreChat = useCallback(async (chatId: string) => {
        try {
            const { error } = await supabase
                .rpc('toggle_cad_chat_archive', {
                    p_chat_id: chatId,
                    p_is_archived: false
                });

            if (error) throw error;

            // Remove from archived chats list
            setArchivedChats(prev => prev.filter(chat => chat.id !== chatId));
            toast.success('Chat restored successfully');
        } catch (error) {
            console.error('Error restoring chat:', error);
            toast.error('Failed to restore chat');
        }
    }, []);

    // Effect to fetch archived chats when dialog opens
    useEffect(() => {
        if (showArchive) {
            fetchArchivedChats();
        }
    }, [showArchive, fetchArchivedChats]);

    if (!user) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "flex items-center transition-all duration-200 ease-in-out",
                            collapsed
                                ? "h-8 w-8 p-0 rounded-none mx-auto mb-3 mt-2"
                                : "w-full h-14 rounded-none px-4",
                            "focus:bg-transparent hover:bg-transparent"
                        )}
                    >
                        <motion.div
                            layout
                            transition={{ duration: 0.2 }}
                        >
                            <AvatarComponent
                                avatarUrl={avatarUrl}
                                userEmail={userEmail}
                                displayName={displayName}
                            />
                        </motion.div>
                        {!collapsed && (
                            <motion.div
                                className="flex flex-1 items-center"
                                initial={false}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                                    <span className="truncate font-semibold">{displayName}</span>
                                    <div className="h-[2px]" />
                                    <div className="flex items-center">
                                        <span className="truncate text-xs text-muted-foreground">Free</span>
                                        <div className="flex items-center ml-2">
                                            <Coins className="h-3 w-3 mr-1 text-[#D73D57]" />
                                            <span className="text-xs text-[#D73D57]">{roidsBalance ?? '—'}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronsUpDown className="ml-auto h-4 w-4" />
                            </motion.div>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={collapsed ? "center" : "start"}
                    className="w-[290px] rounded-none p-0 bg-popover/95 backdrop-blur-sm border -mb-2 mt-2"
                    sideOffset={8}
                >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b flex items-center gap-3">
                        <AvatarComponent
                            avatarUrl={avatarUrl}
                            userEmail={userEmail}
                            displayName={displayName}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="py-2">
                        <DropdownMenuItem
                            className="h-10 px-4 gap-2 cursor-pointer rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent"
                            onClick={() => router.push('/dashboard/settings/billing')}
                        >
                            <CreditCard className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs flex-1 text-muted-foreground hover:text-cyan-500 transition-colors">Billing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="h-10 px-4 gap-2 cursor-pointer rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent"
                            onClick={() => router.push('/dashboard/settings/account')}
                        >
                            <Settings className="h-4 w-4 text-purple-500" />
                            <span className="text-xs flex-1 text-muted-foreground hover:text-purple-500 transition-colors">Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="h-10 px-4 gap-2 cursor-pointer rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4 text-[#D73D57]" />
                            <span className="text-xs flex-1 text-muted-foreground hover:text-[#D73D57] transition-colors">Sign Out</span>
                        </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-0" />

                    {/* Add Archive option before the Preferences section */}
                    <DropdownMenuItem
                        className="h-10 px-4 gap-2 cursor-pointer rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent"
                        onClick={() => setShowArchive(true)}
                    >
                        <Archive className="h-4 w-4 text-orange-500" />
                        <span className="text-xs flex-1 text-muted-foreground hover:text-orange-500 transition-colors">Archived Chats</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-0" />

                    {/* Preferences */}
                    <div className="py-1">
                        <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
                            Preferences
                        </div>
                        <div className="px-4 h-10 flex items-center justify-between rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-blue-500" />
                                <span className="text-xs flex-1 text-muted-foreground hover:text-blue-500 transition-colors">Theme</span>
                            </div>
                            <div className="flex items-center gap-0.5 rounded-none">
                                <button
                                    className={cn(
                                        "rounded-none p-1.5 hover:bg-transparent focus:bg-transparent active:bg-transparent",
                                        theme === 'light' ? "text-blue-500" : "text-muted-foreground hover:text-blue-500 transition-colors"
                                    )}
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun className="h-4 w-4" />
                                </button>
                                <button
                                    className={cn(
                                        "rounded-none p-1.5 hover:bg-transparent focus:bg-transparent active:bg-transparent",
                                        theme === 'dark' ? "text-blue-500" : "text-muted-foreground hover:text-blue-500 transition-colors"
                                    )}
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div
                            onClick={handleLanguageClick}
                            className="px-4 h-10 flex items-center justify-between rounded-none hover:bg-transparent focus:bg-transparent active:bg-transparent cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Languages className="h-4 w-4 text-green-500" />
                                <span className="text-xs flex-1 text-muted-foreground hover:text-green-500 transition-colors">Language</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground hover:text-green-500 transition-colors">
                                    {currentLangName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Plan */}
                    <div className="p-4 border-t">
                        <Button
                            className="w-full h-10 rounded-sm text-sm font-medium bg-transparent hover:bg-transparent border border-foreground/20 text-foreground hover:border-foreground/40 transition-colors"
                            onClick={() => router.push('/dashboard/settings/billing')}
                        >
                            Upgrade
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Archive Dialog */}
            <Dialog open={showArchive} onOpenChange={setShowArchive}>
                <DialogContent className="sm:max-w-[425px] rounded-none p-0 gap-0 bg-background/95 backdrop-blur-sm">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-xl font-semibold">Archived Chats</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] border-y">
                        <div className="p-4">
                            {archivedChats.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No archived chats found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {archivedChats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className="group flex items-center justify-between p-2 hover:bg-muted/50 rounded-sm"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{chat.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Archived on {new Date(chat.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRestoreChat(chat.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Restore
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
});

UserMenu.displayName = 'UserMenu'; 