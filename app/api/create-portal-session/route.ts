import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { data: userData } = await supabase
            .from('user_roids')
            .select('stripe_customer_id')
            .eq('user_id', session.user.id)
            .single()

        if (!userData?.stripe_customer_id) {
            return new NextResponse('No Stripe customer found', { status: 400 })
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: userData.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/billing`,
            configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (error) {
        console.error('Portal session error:', error)
        return new NextResponse('Error creating portal session', { status: 500 })
    }
} 