'use client';

import { ThemeProvider } from 'next-themes';

export function ThemeProviderWrapper({
    children,
    defaultTheme = "dark",
    forcedTheme = "dark",
}: {
    children: React.ReactNode
    defaultTheme?: string
    forcedTheme?: string
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme={defaultTheme}
            forcedTheme={forcedTheme}
            enableSystem={false}
        >
            {children}
        </ThemeProvider>
    )
}