'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import Loader from '@/components/design/loader'

export default function CADRedirectPage() {
    const router = useRouter()
    const { user, isLoading } = useUser()

    useEffect(() => {
        const redirect = async () => {
            if (!isLoading) {
                if (user?.user_metadata?.username) {
                    try {
                        // Get chats that have messages
                        const { data: chats, error } = await supabase
                            .rpc('get_cad_chat_history_v2', { p_limit: 100 })

                        if (error) throw error

                        // Filter to get only chats with messages
                        const validChats = (chats || []).filter((chat: any) =>
                            chat.last_message_at &&
                            chat.title !== 'New Chat' &&
                            chat.title !== 'a new chat'
                        )

                        if (validChats.length > 0) {
                            // Redirect to most recent chat with messages
                            const mostRecentChat = validChats[0] // Already sorted by last_message_at desc
                            await router.replace(`/cad/${user.user_metadata.username}?chat=${mostRecentChat.id}`)
                        } else {
                            // Create a new chat if none exists with messages
                            const { data: newChat, error: createError } = await supabase
                                .rpc('create_cad_chat', {
                                    p_title: 'New Chat',
                                    p_initial_message: null
                                })

                            if (createError) throw createError

                            await router.replace(`/cad/${user.user_metadata.username}?chat=${newChat}`)
                        }
                    } catch (error) {
                        console.error('Error in CAD redirect:', error)
                        // Fallback to basic redirect without chat ID
                        await router.replace(`/cad/${user.user_metadata.username}`)
                    }
                } else {
                    const returnPath = encodeURIComponent('/cad')
                    await router.push(`/sign-in?returnPath=${returnPath}`)
                }
            }
        }

        redirect()
    }, [user, isLoading, router])

    return <Loader />
} 