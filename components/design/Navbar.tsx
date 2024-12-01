'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { Dock } from '@/components/ui/dock';
import Image from 'next/image';

export function Navbar() {
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
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
                            <Image
                                src="/max.png"
                                alt="Logo"
                                width={35}
                                height={35}
                                className="mr-4"
                            />
                            <button
                                onClick={toggleTheme}
                                className="text-foreground text-sm font-bold focus:outline-none"
                            >
                                psychoroid.com
                            </button>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link href="/3d-engine" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                                3D Engine
                            </Link>
                            <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                                — Other
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
                                <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
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

