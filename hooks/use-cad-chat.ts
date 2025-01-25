import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { useUser } from '@/lib/contexts/UserContext'

export interface CADMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    parameters?: any
    created_at: string
}

export interface CADChat {
    id: string
    title: string
    last_message_at: string
    created_at: string
}

export function useCADChat(chatId?: string) {
    const { user } = useUser()
    const [messages, setMessages] = useState<CADMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentChat, setCurrentChat] = useState<CADChat | null>(null)

    const loadChat = useCallback(async (id: string) => {
        if (!user) return

        setIsLoading(true)
        try {
            // Load chat
            const { data: chat, error: chatError } = await supabase
                .from('cad_chats')
                .select('*')
                .eq('id', id)
                .single()

            if (chatError) throw chatError
            setCurrentChat(chat)

            // Load messages
            const { data: messages, error: messagesError } = await supabase
                .from('cad_messages')
                .select('*')
                .eq('chat_id', id)
                .order('created_at', { ascending: true })

            if (messagesError) throw messagesError
            setMessages(messages || [])
        } catch (error) {
            console.error('Error loading CAD chat:', error)
            toast.error('Failed to load CAD chat')
        } finally {
            setIsLoading(false)
        }
    }, [user])

    // Load chat when chatId changes
    useEffect(() => {
        if (chatId) {
            loadChat(chatId)
        } else {
            // Reset state when no chatId
            setMessages([])
            setCurrentChat(null)
        }
    }, [chatId, loadChat])

    const createChat = useCallback(async (title: string) => {
        if (!user) return null

        try {
            const { data, error } = await supabase
                .from('cad_chats')
                .insert([
                    {
                        user_id: user.id,
                        title
                    }
                ])
                .select()
                .single()

            if (error) throw error
            setCurrentChat(data)
            return data
        } catch (error) {
            console.error('Error creating CAD chat:', error)
            toast.error('Failed to create CAD chat')
            return null
        }
    }, [user])

    const saveMessage = useCallback(async (
        content: string,
        role: 'user' | 'assistant',
        parameters?: any
    ) => {
        if (!user || !currentChat) return null

        try {
            // Save message
            const { data: message, error: messageError } = await supabase
                .from('cad_messages')
                .insert([
                    {
                        chat_id: currentChat.id,
                        user_id: user.id,
                        role,
                        content,
                        parameters
                    }
                ])
                .select()
                .single()

            if (messageError) throw messageError

            // Update chat last_message_at
            const { error: chatError } = await supabase
                .from('cad_chats')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', currentChat.id)

            if (chatError) throw chatError

            // Add new message to state without reloading
            setMessages(prev => [...prev, message])
            return message
        } catch (error) {
            console.error('Error saving message:', error)
            toast.error('Failed to save message')
            return null
        }
    }, [user, currentChat])

    const loadUserChats = useCallback(async () => {
        if (!user) return []

        try {
            const { data, error } = await supabase
                .from('cad_chats')
                .select('*')
                .eq('user_id', user.id)
                .order('last_message_at', { ascending: false })

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error loading user chats:', error)
            toast.error('Failed to load CAD chats')
            return []
        }
    }, [user])

    return {
        messages,
        isLoading,
        currentChat,
        createChat,
        loadChat,
        saveMessage,
        loadUserChats
    }
} 