'use client';

import { User } from 'next-auth';
import { ChevronsUpDown, LogOut, Settings, CreditCard, Languages, Monitor, Moon, Sun, Coins } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
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

export function UserMenu({ user, collapsed }: UserMenuProps) {
    const { currentLanguage, setLanguage } = useTranslation();
    const { user: dbUser, signOut, roidsBalance } = useUser();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    if (!user) {
        return null;
    }

    // Get user metadata for proper name display
    const extendedUser = dbUser as ExtendedUser;
    const metadata = extendedUser?.user_metadata || {};
    const avatarUrl = metadata.avatar_url || extendedUser?.image || user.image;
    const firstName = metadata.first_name;
    const lastName = metadata.last_name;
    const username = metadata.username;
    const displayName = username || (firstName && lastName ? `${firstName} ${lastName}` : user.email?.split('@')[0]);
    const userEmail = extendedUser?.email || user.email;

    const AvatarComponent = () => (
        <Avatar className="h-8 w-8 rounded-sm">
            {avatarUrl ? (
                <AvatarImage
                    src={avatarUrl}
                    alt={userEmail || ''}
                    className="h-full w-full rounded-sm object-cover"
                    loading="lazy"
                />
            ) : (
                <AvatarImage
                    src={`https://avatar.vercel.sh/${encodeURIComponent(userEmail?.toLowerCase() || '')}?rounded=true`}
                    alt="Generated avatar"
                    className="h-full w-full rounded-sm object-cover"
                />
            )}
            <AvatarFallback className="rounded-sm">
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
        </Avatar>
    );

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const currentLangName = languages.find(l => l.code === currentLanguage)?.name;

    const handleLanguageClick = () => {
        const currentIndex = languages.findIndex(l => l.code === currentLanguage);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguage(languages[nextIndex].code);
    };

    return (
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
                        <AvatarComponent />
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
                    <Avatar className="h-8 w-8 rounded-sm">
                        {avatarUrl ? (
                            <AvatarImage
                                src={avatarUrl}
                                alt={userEmail || ''}
                                className="h-full w-full rounded-sm object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <AvatarImage
                                src={`https://avatar.vercel.sh/${encodeURIComponent(userEmail?.toLowerCase() || '')}?rounded=true`}
                                alt="Generated avatar"
                                className="h-full w-full rounded-sm object-cover"
                            />
                        )}
                        <AvatarFallback className="rounded-sm">
                            {displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                </div>

                {/* Main Actions */}
                <div className="py-2">
                    <DropdownMenuItem
                        className="h-10 px-4 gap-2 cursor-pointer rounded-none focus:bg-accent"
                        onClick={() => router.push('/dashboard/settings/billing')}
                    >
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="h-10 px-4 gap-2 cursor-pointer rounded-none focus:bg-accent"
                        onClick={() => router.push('/dashboard/settings/account')}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="h-10 px-4 gap-2 cursor-pointer rounded-none focus:bg-accent text-red-600 dark:text-red-400"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Sign Out</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* Preferences */}
                <div className="py-2">
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
                        Preferences
                    </div>
                    <div className="px-4 h-10 flex items-center justify-between rounded-none hover:bg-accent">
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="text-sm">Theme</span>
                        </div>
                        <div className="flex items-center gap-0.5 rounded-none border">
                            <button
                                className={cn(
                                    "rounded-none p-1.5 hover:bg-accent",
                                    theme === 'light' && "bg-accent"
                                )}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="h-4 w-4" />
                            </button>
                            <button
                                className={cn(
                                    "rounded-none p-1.5 hover:bg-accent",
                                    theme === 'dark' && "bg-accent"
                                )}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="h-4 w-4" />
                            </button>
                            <button
                                className={cn(
                                    "rounded-none p-1.5 hover:bg-accent",
                                    theme === 'system' && "bg-accent"
                                )}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div
                        onClick={handleLanguageClick}
                        className="px-4 h-10 flex items-center justify-between rounded-none hover:bg-accent cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            <span className="text-sm">Language</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {currentLangName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Upgrade Plan */}
                <div className="p-4 border-t bg-muted/50">
                    <Button
                        className="w-full h-10 rounded-sm text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => router.push('/dashboard/settings/billing')}
                    >
                        Upgrade
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 