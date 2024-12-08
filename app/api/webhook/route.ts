import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, roidsAmount } = session.metadata!;

        // Use RPC function to record transaction
        const { error } = await supabase.rpc('record_roids_transaction', {
          p_user_id: userId,
          p_amount: parseInt(roidsAmount),
          p_transaction_type: 'purchase',
          p_stripe_session_id: session.id,
          p_description: 'ROIDS purchase via Stripe'
        });

        if (error) {
          console.error('Error recording ROIDS transaction:', error);
          return NextResponse.json(
            { error: 'Failed to process ROIDS purchase' },
            { status: 500 }
          );
        }
        break;

      case 'charge.refunded':
        // Handle refunds if implemented
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook error' },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 