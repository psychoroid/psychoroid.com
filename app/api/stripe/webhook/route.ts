import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Define our expected metadata shape
type MetadataFields = {
    userId: string;
    type: 'subscription' | 'roids_purchase';
    subscription_type?: string;
    roids_amount?: string;
    plan?: string;
};

function hasValidMetadata(metadata: Stripe.Metadata | null): metadata is Stripe.Metadata & MetadataFields {
    if (!metadata) return false;
    
    return (
        typeof metadata.userId === 'string' &&
        typeof metadata.type === 'string' &&
        (metadata.type === 'subscription' || metadata.type === 'roids_purchase')
    );
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;
    const supabase = createRouteHandlerClient({ cookies });

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        console.log(`Processing webhook event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                
                if (!hasValidMetadata(session.metadata)) {
                    throw new Error('Invalid or missing metadata in session');
                }

                const metadata = session.metadata;

                if (metadata.type === 'subscription') {
                    // Add subscription credits
                    await supabase.rpc('add_subscription_credits', {
                        p_user_id: metadata.userId,
                        p_subscription_type: metadata.plan || metadata.subscription_type
                    });

                    // Record the transaction
                    await supabase.from('roids_transactions').insert({
                        user_id: metadata.userId,
                        amount: 0, // Or calculate based on subscription type
                        transaction_type: 'subscription',
                        stripe_session_id: session.id,
                        description: `Subscription started: ${metadata.plan || metadata.subscription_type}`
                    });
                } else if (metadata.type === 'roids_purchase' && metadata.roids_amount) {
                    const amount = parseInt(metadata.roids_amount);
                    
                    // Add ROIDS
                    await supabase.rpc('add_roids', {
                        p_user_id: metadata.userId,
                        p_amount: amount
                    });

                    // Record the transaction
                    await supabase.from('roids_transactions').insert({
                        user_id: metadata.userId,
                        amount: amount,
                        transaction_type: 'purchase',
                        stripe_session_id: session.id,
                        description: `Purchased ${amount} ROIDS`
                    });
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log('Handling expired session:', session.id);
                
                if (!session.metadata?.userId) {
                    console.log('No userId in expired session metadata');
                    break;
                }

                // Record the expired transaction
                await supabase.from('roids_transactions').insert({
                    user_id: session.metadata.userId,
                    amount: 0,
                    transaction_type: 'purchase',
                    stripe_session_id: session.id,
                    description: 'Checkout session expired'
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                
                if (!subscription.metadata.user_id) {
                    console.error('No user_id in subscription metadata:', subscription.id);
                    break;
                }

                // Handle prorated refund
                const canceledAt = subscription.canceled_at;
                const currentPeriodEnd = subscription.current_period_end;
                const currentPeriodStart = subscription.current_period_start;
                
                if (canceledAt && currentPeriodEnd > canceledAt) {
                    const totalPeriod = currentPeriodEnd - currentPeriodStart;
                    const unusedPeriod = currentPeriodEnd - canceledAt;
                    const refundAmount = Math.round(
                        (subscription.items.data[0].price.unit_amount || 0) * (unusedPeriod / totalPeriod)
                    );

                    if (refundAmount > 0) {
                        await stripe.refunds.create({
                            payment_intent: subscription.latest_invoice as string,
                            amount: refundAmount,
                            reason: 'requested_by_customer'
                        });
                    }
                }

                await supabase.rpc('update_subscription_status', {
                    p_user_id: subscription.metadata.user_id,
                    p_subscription_id: null,
                    p_status: 'canceled',
                    p_period_start: null,
                    p_period_end: null
                });
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                
                await supabase.rpc('update_subscription_status', {
                    p_user_id: subscription.metadata.user_id,
                    p_subscription_id: subscription.id,
                    p_status: subscription.status,
                    p_period_start: new Date(subscription.current_period_start * 1000),
                    p_period_end: new Date(subscription.current_period_end * 1000)
                });
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Webhook handler failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
} 