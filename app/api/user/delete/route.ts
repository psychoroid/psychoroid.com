import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
    try {
        const { userId } = await req.json()
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        const supabase = createRouteHandlerClient({ cookies })

        // Delete user data from all tables (RLS will handle permissions)
        await Promise.all([
            supabase.from('user_roids').delete().eq('user_id', userId),
            supabase.from('api_keys').delete().eq('user_id', userId),
            supabase.from('products').delete().eq('user_id', userId),
            supabase.from('support_requests').delete().eq('user_id', userId),
            supabase.from('customers').delete().eq('user_id', userId),
        ])

        // Delete the user account
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)

        if (deleteUserError) {
            throw deleteUserError
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user account' },
            { status: 500 }
        )
    }
} 