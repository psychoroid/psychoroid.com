import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Define our expected metadata shape
type MetadataFields = {
  userId: string;
  type: 'subscription' | 'roids_purchase';
  subscription_type?: string;
  roids_amount?: string;
};

// Type guard function to validate metadata
function hasValidMetadata(metadata: Stripe.Metadata | null): metadata is Stripe.Metadata & MetadataFields {
  if (!metadata) return false;
  
  return (
    typeof metadata.userId === 'string' &&
    typeof metadata.type === 'string' &&
    (metadata.type === 'subscription' || metadata.type === 'roids_purchase')
  );
}

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
        
        if (!hasValidMetadata(session.metadata)) {
          throw new Error('Invalid or missing metadata in session');
        }

        const metadata = session.metadata;

        if (metadata.type === 'subscription') {
          await supabase.rpc('add_subscription_credits', {
            p_user_id: metadata.userId,
            p_subscription_type: metadata.subscription_type
          });
        } else if (metadata.type === 'roids_purchase' && metadata.roids_amount) {
          await supabase.rpc('add_roids', {
            p_user_id: metadata.userId,
            p_amount: parseInt(metadata.roids_amount)
          });
        }
        break;

      case 'charge.refunded':
        // Handle refunds if implemented
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
} 