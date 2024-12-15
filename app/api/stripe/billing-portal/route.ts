import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
})

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()
        
        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'User ID is required' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }
        
        const supabase = createRouteHandlerClient({ cookies })
        
        const { data: userRoid, error: userRoidError } = await supabase
            .from('user_roids')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        if (userRoidError) {
            console.error('❌ Database error:', userRoidError)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch customer data' }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        if (!userRoid?.stripe_customer_id) {
            return new Response(
                JSON.stringify({ url: '/pricing' }),
                { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: userRoid.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        console.error('❌ Error creating billing portal session:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to create billing portal session' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}

export const runtime = 'edge'