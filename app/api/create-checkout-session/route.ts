import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUBSCRIPTION_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  intense: process.env.STRIPE_INTENSE_PRICE_ID,
};

export async function POST(req: Request) {
  try {
    const { package: packageName, userId } = await req.json();
    
    console.log('Received request:', { packageName, userId });
    console.log('Available price IDs:', SUBSCRIPTION_PRICES);

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    let session;

    if (packageName.startsWith('sub_')) {
      const planName = packageName.replace('sub_', '') as keyof typeof SUBSCRIPTION_PRICES;
      const priceId = SUBSCRIPTION_PRICES[planName];

      console.log('Creating session for plan:', { planName, priceId });

      if (!priceId) {
        console.error('Price ID not found for plan:', planName);
        return NextResponse.json(
          { message: `Invalid subscription plan: ${planName}` },
          { status: 400 }
        );
      }

      try {
        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/roids/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/roids/cancel`,
          metadata: {
            userId,
            type: 'subscription',
            plan: planName
          },
        });
      } catch (stripeError) {
        console.error('Stripe session creation error:', stripeError);
        throw stripeError;
      }
    }

    if (!session) {
      return NextResponse.json(
        { message: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 