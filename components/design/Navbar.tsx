'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { Dock } from '../ui/dock';

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
            <nav className="bg-[#121317]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center space-x-8">
                            <button
                                onClick={toggleTheme}
                                className="text-gray-300 text-base font-bold focus:outline-none mr-40"
                            >
                                psychoroid.com
                            </button>
                            <div className="border-l border-transparent h-4 mx-2"></div>
                            <Link href="/3d-engine" className="text-gray-300 hover:text-white rounded-md text-xs font-medium">
                                3D Engine
                            </Link>
                            <Link href="/products" className="text-gray-300 hover:text-white rounded-md text-xs font-medium">
                                Products
                            </Link>
                            <Link href="/story" className="text-gray-300 hover:text-white  rounded-md text-xs font-medium">
                                Story
                            </Link>
                            <div className="border-l border-gray-700 h-4 mx-4"></div>
                        </div>
                        <div className="flex items-center">
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-gray-300 hover:bg-gray-700 rounded-md text-xs font-medium"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <Link href="/auth/sign-in" className="text-gray-300 hover:text-white rounded-md text-xs font-medium">
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