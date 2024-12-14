import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'
import { ThemeProviderWrapper } from '../components/ui/ThemeProvider'
import { UserProvider } from '@/lib/contexts/UserContext'
import { Toaster } from 'sonner';
import { TranslationProvider } from '@/lib/contexts/TranslationContext';
import { headers } from 'next/headers';
import { languages } from '@/lib/i18n/config';

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#000000',
}

export const metadata: Metadata = {
    title: 'psychoroid.com | Open Source Generative AI 3D Engine',
    description: 'The open source generative AI 3D platform for product visualization, 3D modeling, and game development.',
    keywords: '3D viewer, AI 3D, open source, product visualization, 3D modeling, game development, WebGL, Blender, Unity, Unreal Engine, Godot, generative AI, 3D engine, interactive 3D, 3D scan, AR, VR, metaverse, 3D print, CAD, mesh, texturing, rigging, animation, opensource',
    authors: [{ name: 'Princemuichkine' }],
    creator: 'Princemuichkine',
    publisher: 'Princemuichkine',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://psychoroid.com',
        title: 'psychoroid.com | Open Source Generative AI 3D Engine',
        description: 'The open source generative AI 3D platform for product visualization, 3D modeling, and game development.',
        siteName: 'psychoroid.com',
        images: [
            {
                url: '/main.png',
                width: 575,
                height: 575,
                alt: 'psychoroid.com | Open Source Generative AI 3D Engine',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'psychoroid.com | Open Source Generative AI 3D Engine',
        description: 'The open source generative AI 3D platform for product visualization, 3D modeling, and game development.',
        creator: '@Princemuichkine',
        images: [
            {
                url: '/psychoroid.png',
                width: 575,
                height: 575,
                alt: 'psychoroid.com | Open Source Generative AI 3D Engine',
            }
        ],
    },
    verification: {
        google: 'your-google-site-verification',
        yandex: 'your-yandex-verification',
        yahoo: 'your-yahoo-verification',
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/main.png' },
        ],
        apple: [
            { url: '/psychoroid.png' },
        ],
        shortcut: ['/favicon.ico'],
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'psychoroid.com',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Get the user's preferred language from headers
    const headersList = headers();
    const acceptLanguage = headersList.get('accept-language');
    const browserLang = acceptLanguage?.split(',')[0].split('-')[0] || 'en';
    const supportedLangs = languages.map(l => l.code);
    const defaultLang = supportedLangs.includes(browserLang) ? browserLang : 'en';

    return (
        <html lang={defaultLang} suppressHydrationWarning className="dark">
            <body className={`${inter.className} dark:bg-background dark:text-foreground`}>
                <ThemeProviderWrapper defaultTheme="dark">
                    <TranslationProvider>
                        <UserProvider>
                            {children}
                        </UserProvider>
                    </TranslationProvider>
                </ThemeProviderWrapper>
                <Analytics />
                <Toaster theme="dark" />
            </body>
        </html>
    )
}