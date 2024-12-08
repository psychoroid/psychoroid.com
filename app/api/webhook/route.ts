import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// In App Router, we export the HTTP methods directly
export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return new Response('No signature found', { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, roidsAmount } = session.metadata!;

        const { error } = await supabase
          .from('roids_transactions')
          .insert({
            user_id: userId,
            amount: parseInt(roidsAmount),
            transaction_type: 'purchase',
            stripe_session_id: session.id,
            description: 'ROIDS purchase via Stripe'
          });

        if (error) {
          console.error('Error recording ROIDS transaction:', error);
          return new Response('Failed to process ROIDS purchase', { status: 500 });
        }
        break;

      case 'charge.refunded':
        // Handle refunds if implemented
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
} 