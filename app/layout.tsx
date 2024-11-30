import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '3D Product Viewer | Interactive 3D Image Visualization',
    description: 'Upload and view your images in 3D with our interactive product viewer. Features include rotation, zoom, and pan controls with real-time 3D rendering.',
    keywords: '3D viewer, product visualization, 3D modeling, image upload, Three.js, WebGL, interactive 3D',
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
        title: '3D Product Viewer | Interactive 3D Image Visualization',
        description: 'Upload and view your images in 3D with our interactive product viewer. Features include rotation, zoom, and pan controls with real-time 3D rendering.',
        siteName: 'PsychoRoid',
    },
    twitter: {
        card: 'summary_large_image',
        title: '3D Product Viewer | Interactive 3D Image Visualization',
        description: 'Upload and view your images in 3D with our interactive product viewer.',
        creator: '@PrinceMuichkine',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
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
        <html lang="en">
            <head>
                <link rel="canonical" href="https://psychoroid.com" />
                <meta name="theme-color" content="#ffffff" />
            </head>
            <body className={inter.className}>
                {children}
                <Analytics />
            </body>
        </html>
    )
}