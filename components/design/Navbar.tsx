'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import { useTheme } from 'next-themes';
import { Dock } from '@/components/ui/dock';
import Image from 'next/image';
import { useUser } from '@/lib/contexts/UserContext';
import { Coins, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DockDropdown } from './DockDropdown';
import { CompanyDropdown } from './dropdowns/CompanyDropdown';
import { EngineDropdown } from './dropdowns/EngineDropdown';
import { getLocalStorageItem, setLocalStorageItem, clearAuthState } from '@/lib/utils/localStorage';

export function Navbar() {
    const router = useRouter();
    const { session, roidsBalance, signOut } = useUser();
    const { theme, setTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
    const [engineMenuOpen, setEngineMenuOpen] = useState(false);
    const [localRoidsBalance, setLocalRoidsBalance] = useState<number | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isMenuOpen &&
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const fetchUserDashboardData = async () => {
            if (session?.user?.id) {
                try {
                    const { data, error } = await supabase
                        .rpc('get_user_dashboard_data', {
                            p_user_id: session.user.id
                        });

                    if (error) throw error;

                    if (data && data.length > 0) {
                        const { roids_balance } = data[0];
                        setLocalRoidsBalance(roids_balance);
                        // Cache the balance
                        setLocalStorageItem('user-roids-balance', roids_balance.toString());
                    }
                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                    // Try to get from cache if fetch fails
                    const cachedBalance = getLocalStorageItem('user-roids-balance');
                    if (cachedBalance) {
                        setLocalRoidsBalance(parseInt(cachedBalance));
                    }
                }
            }
        };

        fetchUserDashboardData();

        // Set up interval to refresh data every 5 minutes
        const interval = setInterval(fetchUserDashboardData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session]);

    const handleSignOut = async () => {
        try {
            setIsMenuOpen(false);
            // First clear local storage
            clearAuthState();

            // Wait for signOut to complete
            await signOut();

            // Force navigation after a small delay to ensure cleanup is complete
            setTimeout(() => {
                window.location.href = '/auth/sign-in';
            }, 100);
        } catch (error) {
            console.error('Error during sign out:', error);
            // Force redirect even if there's an error
            window.location.href = '/auth/sign-in';
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Dock>
            <nav className="bg-background">
                <div className="max-w-3xl mx-auto pl-2 pr-4">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <button
                                    onClick={toggleTheme}
                                    tabIndex={-1}
                                    className="focus:outline-none"
                                >
                                    <Image
                                        src="/main.png"
                                        alt="Logo"
                                        width={60}
                                        height={60}
                                        className="mr-1 -ml-1"
                                    />
                                </button>
                                <div
                                    onMouseEnter={() => setCompanyMenuOpen(true)}
                                    onMouseLeave={() => setCompanyMenuOpen(false)}
                                >
                                    <Link
                                        href="/"
                                        className="text-foreground text-sm font-bold focus:outline-none"
                                    >
                                        psychoroid.com
                                    </Link>
                                </div>
                            </div>

                            {session && (
                                <div className="hidden md:flex items-center">
                                    <div className="flex items-center text-xs font-medium translate-y-[2px]">
                                        <Coins className="h-3 w-3 mr-1 text-[#D73D57]" />
                                        <span className="text-[#D73D57]">
                                            {roidsBalance ?? '—'}
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium ml-3 translate-y-[2px]"
                                    >
                                        Dashboard
                                    </Link>
                                    <div className="h-4 w-px bg-border ml-6"></div>
                                </div>
                            )}
                        </div>

                        <button
                            ref={buttonRef}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="hidden md:flex items-center space-x-6">
                            <div
                                onMouseEnter={() => setEngineMenuOpen(true)}
                                onMouseLeave={() => setEngineMenuOpen(false)}
                            >
                                <Link
                                    href="/"
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-600 transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    3D Engine
                                </Link>
                            </div>
                            <Link
                                href="/community"
                                className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors text-xs font-medium translate-y-[2px]"
                            >
                                Community
                            </Link>
                            <Link
                                href="https://developers.psychoroid.com"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium translate-y-[2px]"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Resources
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium translate-y-[2px]"
                            >
                                Pricing
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <Link
                                    href="/auth/sign-in"
                                    className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {companyMenuOpen && (
                            <DockDropdown isOpen={companyMenuOpen}>
                                <CompanyDropdown />
                            </DockDropdown>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {engineMenuOpen && (
                            <DockDropdown isOpen={engineMenuOpen}>
                                <EngineDropdown />
                            </DockDropdown>
                        )}
                    </AnimatePresence>

                    <div
                        ref={menuRef}
                        className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-6 pb-4 border-t border-border mt-3`}
                    >
                        <div className="flex flex-col space-y-5">
                            {session && (
                                <>
                                    <div>
                                        <div className="flex items-center text-sm font-medium">
                                            <Coins className="h-4 w-4 mr-2 text-[#D73D57]" />
                                            <span className="text-[#D73D57]">
                                                {roidsBalance ?? '—'}
                                            </span>
                                        </div>
                                        <div className="h-px w-full bg-border mt-5"></div>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <div className="h-px w-full bg-border"></div>
                                </>
                            )}
                            <Link
                                href="/"
                                className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-[#D73D57] dark:hover:text-[#D73D57] transition-colors"
                            >
                                3D Engine
                            </Link>
                            <Link
                                href="/community"
                                className="text-sm font-medium text-emerald-500 dark:text-emerald-400 hover:text-[#D73D57] dark:hover:text-[#D73D57] transition-colors"
                            >
                                Community
                            </Link>
                            <Link
                                href="https://developers.psychoroid.com"
                                className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Resources
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                            >
                                Pricing
                            </Link>
                            {session ? (
                                <>
                                    <div className="h-px w-full bg-border"></div>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-sm font-medium text-left text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="h-px w-full bg-border"></div>
                                    <Link
                                        href="/auth/sign-in"
                                        className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </Dock>
    );
}

