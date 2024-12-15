import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
})

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }
        
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get customer ID from user_roids table
        const { data: userRoid, error: userRoidError } = await supabase
            .from('user_roids')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        if (userRoidError) {
            console.error('Database error:', userRoidError)
            return NextResponse.json(
                { error: 'Failed to fetch customer data' },
                { status: 500 }
            )
        }

        if (!userRoid?.stripe_customer_id) {
            // If no customer exists, redirect to pricing page
            return NextResponse.json({ url: '/pricing' })
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: userRoid.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Error creating billing portal session:', error)
        return NextResponse.json(
            { error: 'Failed to create billing portal session' },
            { status: 500 }
        )
    }
} 