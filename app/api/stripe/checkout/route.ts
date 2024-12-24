import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia'
});

const SUBSCRIPTION_PRICES = {
  automate: process.env.STRIPE_AUTOMATE_PRICE_ID,
  scale: process.env.STRIPE_SCALE_PRICE_ID,
};

const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://www.psychoroid.com'
  : process.env.NEXT_PUBLIC_APP_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { package: packageName, userId } = body;
    
    console.log('📦 Checkout Request:', { packageName, userId, body });
    console.log('💰 Price IDs:', SUBSCRIPTION_PRICES);

    if (!userId) {
      console.error('❌ Missing userId in request');
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    let session;

    if (packageName.startsWith('sub_')) {
      const planName = packageName.replace('sub_', '') as keyof typeof SUBSCRIPTION_PRICES;
      const priceId = SUBSCRIPTION_PRICES[planName];

      console.log('🔄 Creating subscription session:', { planName, priceId });

      if (!priceId) {
        console.error('❌ Invalid price ID for plan:', planName);
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
          success_url: `${baseUrl}/roids/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/roids/cancel?session_id={CHECKOUT_SESSION_ID}`,
          metadata: {
            userId,
            type: 'subscription',
            plan: planName
          },
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
          allow_promotion_codes: true,
          automatic_tax: { enabled: false },
          payment_method_types: ['card'],
          billing_address_collection: 'required',
          customer_email: body.email,
        });

        console.log('✅ Session created successfully:', { 
          sessionId: session.id,
          url: session.url 
        });
      } catch (stripeError) {
        console.error('❌ Stripe session creation error:', stripeError);
        throw stripeError;
      }
    }

    if (packageName === 'custom') {
      const { credits, price } = body;
      
      console.log('🔄 Creating custom credits session:', { credits, price });

      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${credits} Credits`,
                  description: 'Custom credit purchase for psychoroid.com',
                },
                unit_amount: Math.round(parseFloat(price) * 100),
              },
              quantity: 1,
            },
          ],
          success_url: `${baseUrl}/roids/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/roids/cancel?session_id={CHECKOUT_SESSION_ID}`,
          metadata: {
            userId,
            type: 'custom_purchase',
            credits: credits.toString()
          },
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
          customer_email: body.email,
          billing_address_collection: 'required',
          payment_method_types: ['card'],
        });

        console.log('✅ Custom credits session created:', { 
          sessionId: session.id,
          url: session.url 
        });
      } catch (stripeError) {
        console.error('❌ Stripe session creation error:', stripeError);
        throw stripeError;
      }
    }

    if (!session?.url) {
      console.error('❌ No session URL generated');
      return NextResponse.json(
        { message: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error creating checkout session' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';