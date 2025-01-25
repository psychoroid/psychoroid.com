import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
    public: {
        Tables: {
            cad_chats: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    created_at: string
                    updated_at: string
                    last_message_at: string
                    is_archived: boolean
                    metadata: Record<string, any>
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    created_at?: string
                    updated_at?: string
                    last_message_at?: string
                    is_archived?: boolean
                    metadata?: Record<string, any>
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    created_at?: string
                    updated_at?: string
                    last_message_at?: string
                    is_archived?: boolean
                    metadata?: Record<string, any>
                }
            }
            cad_messages: {
                Row: {
                    id: string
                    chat_id: string
                    user_id: string
                    role: 'user' | 'assistant'
                    content: string
                    parameters: Record<string, any>
                    created_at: string
                    metadata: Record<string, any>
                }
                Insert: {
                    id?: string
                    chat_id: string
                    user_id: string
                    role: 'user' | 'assistant'
                    content: string
                    parameters?: Record<string, any>
                    created_at?: string
                    metadata?: Record<string, any>
                }
                Update: {
                    id?: string
                    chat_id?: string
                    user_id?: string
                    role?: 'user' | 'assistant'
                    content?: string
                    parameters?: Record<string, any>
                    created_at?: string
                    metadata?: Record<string, any>
                }
            }
        }
    }
} 