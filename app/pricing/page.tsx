'use client';

import React from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { RoidsBalance } from '@/components/pricing/RoidsBalance';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { Navbar } from '@/components/design/Navbar';

export default function PricingPage() {
    const { user } = useUser();

    const pricingPlans = [
        { name: 'Basic Package', roids: 600, price: 9.99 },
        { name: 'Premium Package', roids: 2000, price: 29.99 },
        { name: 'Pro Package', roids: 5000, price: 59.99 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <Navbar />
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-5xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Pricing
                </h1>
                <p className="text-xl text-center mb-12 text-gray-300">
                    Purchase ROIDS bundles to generate 3D assets. The more ROIDS you have, the more assets you can create, the more tools you can use.
                </p>

                {user ? (
                    <>
                        <RoidsBalance userId={user.id} />
                        <div className="grid md:grid-cols-3 gap-8 mt-8 mb-16">
                            {pricingPlans.map((plan, index) => (
                                <PricingCard key={index} {...plan} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg mb-16">
                        <p className="text-2xl mb-4">Please sign in to purchase ROIDS</p>
                        <Button size="lg" variant="outline">
                            <LogIn className="mr-2 h-4 w-4" /> Sign In
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}