import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Create admin client directly in the API route
const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function DELETE(request: Request) {
    try {
        const requestData = await request.json()
        const { userId } = requestData

        // Debug logging
        console.log('Received request to delete user:', userId)

        if (!userId) {
            console.log('No userId provided')
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Get the authorization header
        const authHeader = request.headers.get('Authorization')
        console.log('Auth header present:', !!authHeader)

        if (!authHeader) {
            return NextResponse.json(
                { error: 'No authorization header' },
                { status: 401 }
            )
        }

        // Extract the token
        const token = authHeader.replace('Bearer ', '')
        
        // Create a Supabase client with the token
        const supabase = createRouteHandlerClient({ cookies })
        
        // Verify the token and get user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

        console.log('Auth user:', authUser?.id)
        console.log('Requested userId:', userId)
        console.log('Auth error:', authError)

        if (authError || !authUser || authUser.id !== userId) {
            console.log('Authorization failed:', { authError, authUser, userId })
            return NextResponse.json(
                { error: 'Unauthorized - Invalid token or user mismatch' },
                { status: 401 }
            )
        }

        // Verify admin client configuration
        console.log('Admin client URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Delete the user using admin client
        const { data, error: deleteError } = await adminClient.auth.admin.deleteUser(
            userId,
            false // Don't soft delete
        )

        if (deleteError) {
            console.error('Delete error:', deleteError)
            return NextResponse.json(
                { error: deleteError.message },
                { status: 500 }
            )
        }

        console.log('User deleted successfully')
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in delete route:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
} 