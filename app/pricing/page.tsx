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
        {
            name: 'Discovery',
            price: 0,
            credits: 200,
            features: [
                '200 credits per month',
                '1 task waiting in queue',
                'Limited queue priority',
                'Assets are under public license',
            ],
            description: 'Best for individual creators'
        },
        {
            name: 'Pro',
            price: 14,
            discountedPrice: 12,
            period: 'month',
            yearlyPrice: 144,
            credits: 1000,
            features: [
                '1,200 credits per month',
                '5 tasks waiting in queue',
                'Standard queue priority',
                'Assets are private & customer owned',
                'AI texture editing',
                'Download community assets',
            ],
            description: 'Best for studios and teams'
        },
        {
            name: 'Intense',
            price: 45,
            discountedPrice: 36,
            period: 'month',
            yearlyPrice: 432,
            credits: 4000,
            features: [
                '4,000 credits per month',
                '20 tasks waiting in queue',
                'Top queue priority',
                'Assets are private & customer owned',
                '8 free retries',
                'AI texture editing',
                'Animate your creations',
                'Download community assets',
            ],
            description: 'Unlock Psychoroid\'s full potential'
        }
    ];

    const handlePurchaseClick = () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
    };

    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Pricing</h1>
                                <p className="text-xs text-muted-foreground">
                                    Choose your plan
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground">
                            <p className="text-xs text-muted-foreground mt-4 mb-2">
                                Purchase ROIDS bundles to generate 3D assets. The more ROIDS you have,
                                the more assets you can create, the more tools you can use.
                            </p>

                            {user && (
                                <div className="mb-8">
                                    <RoidsBalance userId={user.id} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cards Section */}
                    <div className="mt-12 -mx-4">
                        <div className="grid grid-cols-3">
                            {pricingPlans.map((plan, index) => (
                                <div key={index} className="border-r border-t border-b border-border first:border-l">
                                    <PricingCard
                                        {...plan}
                                        onPurchase={handlePurchaseClick}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
}