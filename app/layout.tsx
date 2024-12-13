import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'
import { ThemeProviderWrapper } from '../components/ui/ThemeProvider'
import { UserProvider } from '@/lib/contexts/UserContext'
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export const metadata: Metadata = {
    title: 'psychoroid.com | Open Source Gen AI 3D toolkit',
    description: 'The open source generative AI 3D toolkit for product visualization, 3D modeling, and game development.',
    keywords: '3D viewer, AI 3D, open source, product visualization, 3D modeling, game development, WebGL, Blender, Unity, Unreal Engine, Godot, generative AI, 3D toolkit, interactive 3D, 3D scan, AR, VR, metaverse, 3D print, CAD, mesh, texturing, rigging, animation, opensource, AI 3D Toolkit, AI 3D Toolkit for Blender, AI 3D Toolkit for Unreal Engine, AI 3D Toolkit for Unity, AI 3D Toolkit for Godot',
    authors: [{ name: 'Prince Muichkine' }],
    creator: 'Prince Muichkine',
    publisher: 'Prince Muichkine',
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
        title: 'psychoroid.com | Open Source Gen AI 3D toolkit',
        description: 'The open source generative AI 3D toolkit for product visualization, 3D modeling, and game development.',
        siteName: 'psychoroid.com',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'psychoroid.com | Open Source Gen AI 3D toolkit',
        description: 'The open source generative AI 3D toolkit for product visualization, 3D modeling, and game development.',
        creator: '@PrinceMuichkine',
    },
    verification: {
        google: 'your-google-site-verification',
        yandex: 'your-yandex-verification',
        yahoo: 'your-yahoo-verification',
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/psychoroid.png' },
        ],
        apple: [
            { url: '/psychoroid.png' },
        ],
        shortcut: ['/favicon.ico'],
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className={`${inter.className} dark:bg-background dark:text-foreground`}>
                <ThemeProviderWrapper defaultTheme="dark">
                    <UserProvider>
                        {children}
                    </UserProvider>
                </ThemeProviderWrapper>
                <Analytics />
                <Toaster theme="dark" />
            </body>
        </html>
    )
}