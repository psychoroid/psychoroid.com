import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

        switch (event.type) {
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                
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

                // Update user subscription status
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
        }

        return new Response(JSON.stringify({ received: true }));
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ error: 'Webhook handler failed' }), 
            { status: 400 }
        );
    }
} 