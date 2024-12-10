'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { Dock } from '@/components/ui/dock';
import Image from 'next/image';
import { useUser } from '@/lib/contexts/UserContext';
import { Coins, Menu } from 'lucide-react';
import { getUserRoidsBalance } from '@/lib/roids/roids';

export function Navbar() {
    const router = useRouter();
    const { session } = useUser();
    const { theme, setTheme } = useTheme();
    const [roidsBalance, setRoidsBalance] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        async function fetchRoidsBalance() {
            if (session?.user?.id) {
                try {
                    const balance = await getUserRoidsBalance(session.user.id);
                    setRoidsBalance(balance);
                } catch (error) {
                    console.error('Error fetching ROIDS balance:', error);
                }
            }
        }

        fetchRoidsBalance();
    }, [session?.user?.id]);

    const handleSignOut = async () => {
        localStorage.removeItem('cachedImages');
        localStorage.removeItem('cachedSelectedImage');
        await supabase.auth.signOut();
        router.push('/');
        window.location.reload();
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Dock>
            <nav className="bg-background">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <button onClick={toggleTheme}>
                                    <Image
                                        src="/main.png"
                                        alt="Logo"
                                        width={60}
                                        height={60}
                                        className="mr-1"
                                    />
                                </button>
                                <Link
                                    href="/"
                                    className="text-foreground text-sm font-bold focus:outline-none"
                                >
                                    psychoroid.com
                                </Link>
                            </div>

                            {session && (
                                <div className="hidden md:flex items-center space-x-4">
                                    <div className="flex items-center text-xs font-medium">
                                        <Coins className="h-3 w-3 mr-1 text-[#D73D57]" />
                                        <span className="text-[#D73D57]">
                                            {roidsBalance ?? '—'}
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/"
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-xs font-medium"
                            >
                                3D Engine
                            </Link>
                            <Link
                                href="/community"
                                className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors text-xs font-medium"
                            >
                                Community
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                Pricing
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <Link
                                    href="/auth/sign-in"
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4 border-t border-border`}>
                        <div className="flex flex-col space-y-4">
                            {session && (
                                <>
                                    <div className="flex items-center text-xs font-medium">
                                        <Coins className="h-3 w-3 mr-1 text-[#D73D57]" />
                                        <span className="text-[#D73D57]">
                                            {roidsBalance ?? '—'}
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                </>
                            )}
                            <Link
                                href="/"
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-xs font-medium"
                            >
                                3D Engine
                            </Link>
                            <Link
                                href="/community"
                                className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors text-xs font-medium"
                            >
                                Community
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                Pricing
                            </Link>
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium text-left"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <Link
                                    href="/auth/sign-in"
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </Dock>
    );
}

