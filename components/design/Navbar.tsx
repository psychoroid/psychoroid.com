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
import { Coins } from 'lucide-react';
import { getUserRoidsBalance } from '@/lib/roids/roids';

export function Navbar() {
    const router = useRouter();
    const { session } = useUser();
    const { theme, setTheme } = useTheme();
    const [roidsBalance, setRoidsBalance] = useState<number | null>(null);

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
                        <div className="flex items-center">
                            <Link href="/">
                                <Image
                                    src="/main.png"
                                    alt="Logo"
                                    width={60}
                                    height={60}
                                    className="mr-1"
                                />
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="text-foreground text-sm font-bold focus:outline-none"
                            >
                                psychoroid.com
                            </button>
                            {session && (
                                <>
                                    <div className="ml-2 mt-0.5 flex items-center text-xs font-medium">
                                        <Coins className="h-3 w-3 mr-1 text-[#D73D57]" />
                                        <span className="text-[#D73D57]">
                                            {roidsBalance ?? '—'}
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="ml-4 mt-0.5 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link
                                href="/"
                                className="text-blue-500 dark:text-blue-400 mt-0.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-xs font-medium"
                            >
                                3D Engine
                            </Link>
                            <Link
                                href="/game-assets"
                                className="text-emerald-500 dark:text-emerald-400 mt-0.5 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors text-xs font-medium"
                            >
                                Community
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 text-xs font-medium"
                            >
                                Pricing
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 text-xs font-medium"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground mt-0.5 transition-colors text-xs font-medium">
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

