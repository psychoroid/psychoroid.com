import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia'
});

// Initialize Supabase client for edge runtime
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 60;

// Disable body parsing, we need the raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    try {
        // Get the raw request body as a string
        const rawBody = await req.text();
        
        // Get the Stripe signature from headers
        const headersList = headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            console.error('⚠️ No Stripe signature found in webhook request');
            return new Response('No Stripe signature found', { status: 400 });
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
            return new Response('Webhook secret is not configured', { status: 500 });
        }

        // Log request details for debugging (but not the raw body to avoid security issues)
        console.log('📝 Webhook Request Details:', {
            signature,
            bodyLength: rawBody.length,
            headers: {
                'stripe-signature': signature,
                'content-type': headersList.get('content-type'),
            }
        });

        // Verify the event with Stripe
        let event: Stripe.Event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                rawBody,
                signature,
                webhookSecret
            );
            console.log('✅ Webhook signature verified successfully for event:', event.type);
        } catch (err) {
            const error = err as Error;
            console.error('❌ Webhook signature verification failed:', {
                error: error.message,
                stack: error.stack
            });
            return new Response(`Webhook Error: ${error.message}`, { status: 400 });
        }

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
                        const { error } = await supabase.rpc('handle_expired_session', {
                            p_user_id: userId,
                            p_session_id: session.id
                        });

                        if (error) {
                            console.error('❌ Failed to handle expired session:', error);
                            throw error;
                        }
                        
                        console.log('✅ Recorded expired session:', session.id);
                    } catch (error) {
                        console.error('❌ Failed to record expired session:', error);
                        // Don't throw the error, just log it and continue
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