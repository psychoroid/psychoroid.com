import { useState } from 'react';
import { getStripe } from '../../lib/stripe/stripe';

const ROIDS_PACKAGES = {
    basic: { roids: 600, price: 9.99 },
    premium: { roids: 2000, price: 29.99 },
    pro: { roids: 5000, price: 59.99 },
};

export default function RoidsPurchase({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);

    const handlePurchase = async (packageName: string) => {
        try {
            setLoading(true);

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: packageName,
                    userId,
                }),
            });

            const { sessionId } = await response.json();
            const stripe = await getStripe();

            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    console.error('Stripe checkout error:', error);
                }
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {Object.entries(ROIDS_PACKAGES).map(([key, pkgData]) => (
                <div key={key} className="border rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold mb-4">{key.charAt(0).toUpperCase() + key.slice(1)} Package</h3>
                    <p className="text-3xl font-bold mb-2">{pkgData.roids} ROIDS</p>
                    <p className="text-xl mb-4">${pkgData.price}</p>
                    <button
                        onClick={() => handlePurchase(key)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Purchase'}
                    </button>
                </div>
            ))}
        </div>
    );
} 