import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/contexts/UserContext';
import { getStripe } from '@/lib/stripe/stripe';

interface PricingCardProps {
    name: string;
    roids: number;
    price: number;
}

export function PricingCard({ name, roids, price }: PricingCardProps) {
    const { user } = useUser();
    const [loading, setLoading] = React.useState(false);

    const handlePurchase = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: name.toLowerCase().replace(' package', ''),
                    userId: user?.id,
                }),
            });

            const { sessionId } = await response.json();
            const stripe = await getStripe();

            if (!stripe) {
                throw new Error('Stripe not initialized');
            }

            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
                console.error('Stripe checkout error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-gray-800 border-gray-700 hover:border-purple-500 transition-all">
            <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{name}</h3>
                <div className="text-4xl font-bold mb-2 text-purple-400">
                    {roids} <span className="text-lg">ROIDS</span>
                </div>
                <div className="text-2xl mb-6">${price}</div>
                <Button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    {loading ? 'Processing...' : 'Purchase Now'}
                </Button>
            </div>
        </Card>
    );
}

