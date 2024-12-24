'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navbar } from '@/components/design/Navbar'
import { Footer } from '@/components/design/Footer'
import HeadLoader from '@/components/design/loader'

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { session, isLoading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !session) {
            router.push('/auth/sign-in')
        }
    }, [session, isLoading, router])

    if (isLoading) {
        return <HeadLoader />
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-grow pt-16">
                {children}
            </main>
            <Footer />
        </div>
    )
} 