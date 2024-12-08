'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { RoidsBalance } from '@/components/pricing/RoidsBalance';
import { Navbar } from '@/components/design/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { Footer } from '@/components/design/Footer';

export default function PricingPage() {
    const { user } = useUser();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const pricingPlans = [
        { name: 'Discovery', roids: 600, price: 9.99 },
        { name: 'Premium', roids: 2000, price: 29.99 },
        { name: 'Intense', roids: 5000, price: 59.99 },
    ];

    const handlePurchaseClick = () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        // Handle purchase for logged in users
    };

    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-12">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <h1 className="text-foreground text-xl font-bold">Pricing</h1>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <p className="text-xs mb-8 text-muted-foreground">
                                    Purchase ROIDS bundles to generate 3D assets. The more ROIDS you have,
                                    the more assets you can create, the more tools you can use.
                                </p>

                                {user && (
                                    <div className="mb-8">
                                        <RoidsBalance userId={user.id} />
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-6">
                                    {pricingPlans.map((plan, index) => (
                                        <PricingCard
                                            key={index}
                                            {...plan}
                                            onPurchase={handlePurchaseClick}
                                        />
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
}