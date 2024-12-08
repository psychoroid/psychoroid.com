import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabase } from '@/lib/supabase/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  try {
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
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
          return res.status(500).json({ error: 'Failed to process ROIDS purchase' });
        }
        break;

      case 'charge.refunded':
        // Handle refunds if implemented
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ message: 'Webhook error' });
  }
} 