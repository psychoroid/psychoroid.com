'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';

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
        <nav className="bg-gray-800 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={toggleTheme}
                            className="text-white text-xl font-bold focus:outline-none"
                        >
                            psychoroid.com
                        </button>
                    </div>
                    <div className="flex">
                        {session ? (
                            <button
                                onClick={handleSignOut}
                                className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/auth/sign-up"
                                    className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign Up
                                </Link>
                                <Link
                                    href="/auth/sign-in"
                                    className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium ml-4"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
} 