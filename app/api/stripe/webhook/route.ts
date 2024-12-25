import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia'
});

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = headers().get('stripe-signature');

        if (!signature) {
            console.log('⚠️ No signature found in webhook request');
            return new Response('No signature found', { status: 400 });
        }

        // Verify the event with Stripe
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            const error = err as Error;
            console.log(`⚠️ Webhook signature verification failed:`, error.message);
            return new Response(`Webhook Error: ${error.message}`, { status: 400 });
        }

        const supabase = createRouteHandlerClient({ cookies });

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (!userId) {
                    console.log('⚠️ No userId found in session metadata');
                    break;
                }

                if (session.metadata?.type === 'subscription' && session.subscription) {
                    try {
                        // Get subscription details from Stripe
                        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                        
                        // Add subscription credits and update subscription details
                        await supabase.rpc('add_subscription_credits', {
                            p_user_id: userId,
                            p_subscription_type: session.metadata.plan,
                            p_subscription_id: subscription.id,
                            p_customer_id: session.customer as string,
                            p_period_start: new Date(subscription.current_period_start * 1000),
                            p_period_end: new Date(subscription.current_period_end * 1000)
                        });

                        console.log('✅ Subscription details:', {
                            userId,
                            plan: session.metadata.plan,
                            subscriptionId: subscription.id,
                            customerId: session.customer,
                            periodStart: new Date(subscription.current_period_start * 1000),
                            periodEnd: new Date(subscription.current_period_end * 1000)
                        });

                        // Record transaction
                        await supabase.from('roids_transactions').insert({
                            user_id: userId,
                            amount: 0,
                            transaction_type: 'subscription',
                            stripe_session_id: session.id,
                            description: `Subscription started: ${session.metadata.plan}`
                        });

                        console.log(`✅ Subscription credits added for user ${userId}`);
                    } catch (error) {
                        console.error('❌ Error processing subscription:', error);
                        throw error;
                    }
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                console.log('Session expired:', {
                    sessionId: session.id,
                    userId,
                    metadata: session.metadata
                });

                if (userId) {
                    try {
                        await supabase.from('roids_transactions').insert({
                            user_id: userId,
                            amount: 0,
                            transaction_type: 'expired',
                            stripe_session_id: session.id,
                            description: 'Checkout session expired',
                            status: 'expired'
                        });
                        console.log('✅ Recorded expired session:', session.id);
                    } catch (error) {
                        console.error('❌ Failed to record expired session:', error);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;

                if (!userId) {
                    console.log('⚠️ No user_id found in subscription metadata');
                    break;
                }

                await supabase.rpc('update_subscription_status', {
                    p_user_id: userId,
                    p_subscription_id: null,
                    p_status: 'canceled',
                    p_period_start: null,
                    p_period_end: null
                });

                console.log(`✅ Subscription canceled for user ${userId}`);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;

                if (!userId || !subscription.current_period_start || !subscription.current_period_end) {
                    console.log('⚠️ Missing required subscription data');
                    break;
                }

                await supabase.rpc('update_subscription_status', {
                    p_user_id: userId,
                    p_subscription_id: subscription.id,
                    p_status: subscription.status,
                    p_period_start: new Date(subscription.current_period_start * 1000),
                    p_period_end: new Date(subscription.current_period_end * 1000)
                });

                console.log(`✅ Subscription updated for user ${userId}`);
                break;
            }

            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Webhook handler failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}