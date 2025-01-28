import { useState, useCallback, useEffect, useRef } from 'react'
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
    const loadAttempts = useRef(0)

    // Function to load chat data
    const loadChatData = useCallback(async (id: string) => {
        console.log('Attempting to load chat data:', { id, user: !!user, attempt: loadAttempts.current });
        
        if (!user) {
            console.log('No user available, retrying...');
            if (loadAttempts.current < 5) {
                loadAttempts.current++;
                setTimeout(() => loadChatData(id), 500);
            }
            return;
        }

        setIsLoading(true);
        try {
            console.log('Loading chat and messages...');
            const [chatResponse, messagesResponse] = await Promise.all([
                supabase
                    .from('cad_chats')
                    .select('*')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('cad_messages')
                    .select('*')
                    .eq('chat_id', id)
                    .order('created_at', { ascending: true })
            ]);

            if (chatResponse.error) throw chatResponse.error;
            if (messagesResponse.error) throw messagesResponse.error;

            console.log('Data loaded successfully:', {
                chat: chatResponse.data,
                messageCount: messagesResponse.data?.length
            });

            setCurrentChat(chatResponse.data);
            setMessages(messagesResponse.data || []);
        } catch (error) {
            console.error('Error loading chat data:', error);
            toast.error('Failed to load chat');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial load effect
    useEffect(() => {
        if (chatId) {
            console.log('Initial load triggered for chat:', chatId);
            loadChatData(chatId);
        } else {
            setMessages([]);
            setCurrentChat(null);
        }

        return () => {
            loadAttempts.current = 0;
        };
    }, [chatId, loadChatData]);

    // Reload when user becomes available
    useEffect(() => {
        if (user && chatId && messages.length === 0) {
            console.log('User became available, reloading chat:', chatId);
            loadChatData(chatId);
        }
    }, [user, chatId, loadChatData, messages.length]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!chatId || !user) return;

        console.log('Setting up real-time subscriptions for chat:', chatId);
        const channel = supabase
            .channel(`chat_${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cad_chats',
                    filter: `id=eq.${chatId}`
                },
                (payload) => {
                    console.log('Chat updated:', payload);
                    setCurrentChat(prev => {
                        if (prev && payload.new.id) {
                            return {
                                id: payload.new.id,
                                title: payload.new.title || prev.title,
                                last_message_at: payload.new.last_message_at || prev.last_message_at,
                                created_at: payload.new.created_at || prev.created_at
                            };
                        }
                        return prev;
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cad_messages',
                    filter: `chat_id=eq.${chatId}`
                },
                () => {
                    console.log('Messages changed, reloading chat:', chatId);
                    loadChatData(chatId);
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up subscriptions for chat:', chatId);
            channel.unsubscribe();
        };
    }, [chatId, user, loadChatData]);

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
            
            // Set current chat and initialize empty messages
            setCurrentChat(data)
            setMessages([])
            
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
        loadChatData,
        saveMessage,
        loadUserChats,
        setMessages
    }
} 