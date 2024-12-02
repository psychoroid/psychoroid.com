'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { Dock } from '@/components/ui/dock';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';

export function Navbar() {
    const router = useRouter();
    const { session } = useUser();
    const { theme, setTheme } = useTheme();

    const handleSignOut = async () => {
        // Clear local storage
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
            <nav className="bg-background/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center">
                            <Link href="/">
                                <Image
                                    src="/main.png"
                                    alt="Logo"
                                    width={60}
                                    height={60}
                                    className="mr-2"
                                />
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="text-foreground text-sm font-bold focus:outline-none"
                            >
                                psychoroid.com
                            </button>
                            {session && (
                                <Link
                                    href="/dashboard"
                                    className="ml-2 mt-0.5 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link href="/" className="text-muted-foreground mt-0.5 hover:text-foreground transition-colors text-xs font-medium">
                                3D Engine
                            </Link>
                            <Link href="/GCD" className="text-muted-foreground mt-0.5 hover:text-foreground transition-colors text-xs font-medium">
                                — GCD
                            </Link>
                            <Link href="/game-assets" className="text-muted-foreground mt-0.5 hover:text-foreground transition-colors text-xs font-medium">
                                Game assets
                            </Link>
                            <Link href="/pricing" className="text-muted-foreground mt-0.5 hover:text-foreground transition-colors text-xs font-medium">
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

