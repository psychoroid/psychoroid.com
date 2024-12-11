'use client';

import { ThemeProvider } from 'next-themes';

export function ThemeProviderWrapper({
    children,
    defaultTheme = "dark",
}: {
    children: React.ReactNode
    defaultTheme?: string
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme={defaultTheme}
            enableSystem={false}
        >
            {children}
        </ThemeProvider>
    )
}