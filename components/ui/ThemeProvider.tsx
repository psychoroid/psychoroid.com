'use client';

import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
            {children}
        </ThemeProvider>
    );
}