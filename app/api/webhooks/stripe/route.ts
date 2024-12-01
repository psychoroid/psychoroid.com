import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    switch (event.type) {
        case 'checkout.session.completed':
            // Handle successful payment
            break
        case 'payment_intent.succeeded':
            // Handle successful payment intent
            break
        case 'payment_intent.payment_failed':
            // Handle failed payment intent
            break
        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
} 