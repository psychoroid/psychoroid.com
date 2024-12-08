import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const ROIDS_PACKAGES = {
  basic: { roids: 600, price: 999 }, // $9.99
  premium: { roids: 2000, price: 2999 }, // $29.99
  pro: { roids: 5000, price: 5999 }, // $59.99
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { package: packageName, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const selectedPackage = ROIDS_PACKAGES[packageName as keyof typeof ROIDS_PACKAGES];

    if (!selectedPackage) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.roids} ROIDS Bundles`,
              description: `Purchase ${selectedPackage.roids} ROIDS for psychoroid.com`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/roids/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/roids/cancel`,
      metadata: {
        userId,
        roidsAmount: selectedPackage.roids.toString(),
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
} 