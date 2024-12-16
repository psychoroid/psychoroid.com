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
import { AnimatePresence } from 'framer-motion';
import { DockDropdown } from './DockDropdown';
import { CompanyDropdown } from './dropdowns/PsychoroidDropdown';
// import { EngineDropdown } from './dropdowns/EngineDropdown';
import { getLocalStorageItem, setLocalStorageItem, clearAuthState } from '@/lib/utils/localStorage';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { ResourcesDropdown } from './dropdowns/DevelopersDropdown';

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
    const { currentLanguage } = useTranslation();
    const companyTimeoutRef = useRef<NodeJS.Timeout>();
    const engineTimeoutRef = useRef<NodeJS.Timeout>();
    const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
    const resourcesTimeoutRef = useRef<NodeJS.Timeout>();

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
            // Get current path before signing out
            const currentPath = window.location.pathname;
            setIsMenuOpen(false);

            // Store the intended redirect path
            if (!currentPath.startsWith('/dashboard')) {
                sessionStorage.setItem('signOutRedirectPath', currentPath);
            }

            await signOut();
            clearAuthState();

            // Force immediate redirect if on dashboard
            if (currentPath.startsWith('/dashboard')) {
                window.location.href = '/';  // Use window.location for immediate redirect
            }

        } catch (error) {
            console.error('Error signing out:', error);

            // Even if sign out fails, force redirect from dashboard
            if (window.location.pathname.startsWith('/dashboard')) {
                window.location.href = '/';
            }
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleCompanyMenuEnter = () => {
        if (companyTimeoutRef.current) {
            clearTimeout(companyTimeoutRef.current);
        }
        setCompanyMenuOpen(true);
    };

    const handleCompanyMenuLeave = () => {
        companyTimeoutRef.current = setTimeout(() => {
            setCompanyMenuOpen(false);
        }, 300); // 300ms delay before closing
    };

    const handleEngineMenuEnter = () => {
        if (engineTimeoutRef.current) {
            clearTimeout(engineTimeoutRef.current);
        }
        setEngineMenuOpen(true);
    };

    const handleEngineMenuLeave = () => {
        engineTimeoutRef.current = setTimeout(() => {
            setEngineMenuOpen(false);
        }, 300); // 300ms delay before closing
    };

    const handleResourcesMenuEnter = () => {
        if (resourcesTimeoutRef.current) {
            clearTimeout(resourcesTimeoutRef.current);
        }
        setResourcesMenuOpen(true);
    };

    const handleResourcesMenuLeave = () => {
        resourcesTimeoutRef.current = setTimeout(() => {
            setResourcesMenuOpen(false);
        }, 300);
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
                                        src="/transparent.png"
                                        alt="Logo"
                                        width={55}
                                        height={55}
                                        className="mr-1 -ml-1"
                                    />
                                </button>
                                <div
                                    onMouseEnter={handleCompanyMenuEnter}
                                    onMouseLeave={handleCompanyMenuLeave}
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
                                        className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium ml-3 translate-y-[2px]"
                                    >
                                        {t(currentLanguage, 'navbar.dashboard')}
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
                                onMouseEnter={handleEngineMenuEnter}
                                onMouseLeave={handleEngineMenuLeave}
                            >
                                <Link
                                    href="/"
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-600 transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    {t(currentLanguage, 'navbar.engine')}
                                </Link>
                            </div>
                            <Link
                                href="/community"
                                className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-600 transition-colors text-xs font-medium translate-y-[2px]"
                            >
                                {t(currentLanguage, 'navbar.community')}
                            </Link>
                            <div
                                onMouseEnter={handleResourcesMenuEnter}
                                onMouseLeave={handleResourcesMenuLeave}
                                className="translate-y-[1px]"
                            >
                                <Link
                                    href="https://developers.psychoroid.com"
                                    className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t(currentLanguage, 'navbar.resources')}
                                </Link>
                            </div>
                            <Link
                                href="/pricing"
                                className="text-orange-400 hover:text-orange-300 transition-colors text-xs font-medium translate-y-[2px]"
                            >
                                {t(currentLanguage, 'navbar.pricing')}
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    {t(currentLanguage, 'navbar.sign_out')}
                                </button>
                            ) : (
                                <Link
                                    href="/auth/sign-in"
                                    className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium translate-y-[2px]"
                                >
                                    {t(currentLanguage, 'navbar.sign_in')}
                                </Link>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {companyMenuOpen && (
                            <div
                                onMouseEnter={handleCompanyMenuEnter}
                                onMouseLeave={handleCompanyMenuLeave}
                            >
                                <DockDropdown isOpen={companyMenuOpen}>
                                    <CompanyDropdown />
                                </DockDropdown>
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {resourcesMenuOpen && (
                            <div
                                onMouseEnter={handleResourcesMenuEnter}
                                onMouseLeave={handleResourcesMenuLeave}
                            >
                                <DockDropdown isOpen={resourcesMenuOpen}>
                                    <ResourcesDropdown />
                                </DockDropdown>
                            </div>
                        )}
                    </AnimatePresence>

                    <div
                        ref={menuRef}
                        className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-6 pb-4 border-t border-border mt-0`}
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
                                        {t(currentLanguage, 'navbar.dashboard')}
                                    </Link>
                                    <div className="h-px w-full bg-border"></div>
                                </>
                            )}
                            <Link
                                href="/"
                                className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-[#D73D57] dark:hover:text-[#D73D57] transition-colors"
                            >
                                {t(currentLanguage, 'navbar.engine')}
                            </Link>
                            <Link
                                href="/community"
                                className="text-sm font-medium text-emerald-500 dark:text-emerald-400 hover:text-[#D73D57] dark:hover:text-[#D73D57] transition-colors"
                            >
                                {t(currentLanguage, 'navbar.community')}
                            </Link>
                            <div
                                onMouseEnter={handleResourcesMenuEnter}
                                onMouseLeave={handleResourcesMenuLeave}
                            >
                                <Link
                                    href="https://developers.psychoroid.com"
                                    className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t(currentLanguage, 'navbar.resources')}
                                </Link>
                            </div>
                            <Link
                                href="/pricing"
                                className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                            >
                                {t(currentLanguage, 'navbar.pricing')}
                            </Link>
                            {session ? (
                                <>
                                    <div className="h-px w-full bg-border"></div>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-sm font-medium text-left text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    >
                                        {t(currentLanguage, 'navbar.sign_out')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="h-px w-full bg-border"></div>
                                    <Link
                                        href="/auth/sign-in"
                                        className="text-sm font-medium text-muted-foreground hover:text-[#D73D57] transition-colors"
                                    >
                                        {t(currentLanguage, 'navbar.sign_in')}
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

