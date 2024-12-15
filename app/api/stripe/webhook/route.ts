import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { StripeEvent } from '@/types/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        if (req.method !== 'POST') {
            return NextResponse.json(
                { error: 'Method not allowed' },
                { status: 405 }
            );
        }

        const body = await req.text();
        const signature = headers().get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'No signature found' },
                { status: 400 }
            );
        }

        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        ) as StripeEvent;

        const supabase = createRouteHandlerClient({ cookies });
        const { object } = event.data;

        console.log('Processing webhook event:', {
            type: event.type,
            id: event.id,
            metadata: object.metadata
        });

        switch (event.type) {
            case 'checkout.session.completed': {
                const userId = object.metadata.userId;
                if (!userId) {
                    throw new Error('Invalid or missing userId in session metadata');
                }

                if (object.metadata.type === 'subscription') {
                    await supabase.rpc('add_subscription_credits', {
                        p_user_id: userId,
                        p_subscription_type: object.metadata.plan
                    });

                    await supabase.from('roids_transactions').insert({
                        user_id: userId,
                        amount: 0,
                        transaction_type: 'subscription',
                        stripe_session_id: object.id,
                        description: `Subscription started: ${object.metadata.plan}`
                    });
                } else if (object.metadata.type === 'custom_purchase' && object.metadata.credits) {
                    const amount = parseInt(object.metadata.credits);
                    
                    await supabase.rpc('add_roids', {
                        p_user_id: userId,
                        p_amount: amount
                    });

                    await supabase.from('roids_transactions').insert({
                        user_id: userId,
                        amount,
                        transaction_type: 'purchase',
                        stripe_session_id: object.id,
                        description: `Purchased ${amount} ROIDS`
                    });
                }
                break;
            }

            case 'checkout.session.expired': {
                const userId = object.metadata.userId;
                console.log('Session expired:', {
                    sessionId: object.id,
                    userId,
                    metadata: object.metadata
                });
                
                if (userId) {
                    try {
                        await supabase.from('roids_transactions').insert({
                            user_id: userId,
                            amount: 0,
                            transaction_type: 'purchase',
                            stripe_session_id: object.id,
                            description: 'Checkout session expired',
                            status: 'expired'
                        });
                        console.log('Recorded expired session:', object.id);
                    } catch (error) {
                        console.error('Failed to record expired session:', error);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const userId = object.metadata.user_id;
                if (!userId) {
                    console.error('No user_id in subscription metadata:', object.id);
                    break;
                }

                // Handle prorated refund if needed
                if (object.canceled_at && 
                    object.current_period_end && 
                    object.current_period_start && 
                    object.items?.data?.[0]?.price?.unit_amount && 
                    object.current_period_end > object.canceled_at) {
                    
                    const totalPeriod = object.current_period_end - object.current_period_start;
                    const unusedPeriod = object.current_period_end - object.canceled_at;
                    const refundAmount = Math.round(
                        object.items.data[0].price.unit_amount * (unusedPeriod / totalPeriod)
                    );

                    if (refundAmount > 0 && object.latest_invoice) {
                        await stripe.refunds.create({
                            payment_intent: object.latest_invoice,
                            amount: refundAmount,
                            reason: 'requested_by_customer'
                        });
                    }
                }

                await supabase.rpc('update_subscription_status', {
                    p_user_id: userId,
                    p_subscription_id: null,
                    p_status: 'canceled',
                    p_period_start: null,
                    p_period_end: null
                });
                break;
            }

            case 'customer.subscription.updated': {
                const userId = object.metadata.user_id;
                if (!userId) break;

                if (!object.current_period_start || !object.current_period_end || !object.status) {
                    console.error('Missing required subscription data:', object.id);
                    break;
                }

                await supabase.rpc('update_subscription_status', {
                    p_user_id: userId,
                    p_subscription_id: object.id,
                    p_status: object.status,
                    p_period_start: new Date(object.current_period_start * 1000),
                    p_period_end: new Date(object.current_period_end * 1000)
                });
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { 
                error: 'Webhook handler failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 