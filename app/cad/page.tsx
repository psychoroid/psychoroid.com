'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/contexts/UserContext'
import Loader from '@/components/design/loader'

export default function CADRedirectPage() {
    const router = useRouter()
    const { user, isLoading } = useUser()

    useEffect(() => {
        if (!isLoading) {
            if (user?.user_metadata?.username) {
                router.replace(`/cad/${user.user_metadata.username}`)
            } else {
                const returnPath = encodeURIComponent('/cad')
                router.push(`/sign-in?returnPath=${returnPath}`)
            }
        }
    }, [user, isLoading, router])

    return <Loader />
} 