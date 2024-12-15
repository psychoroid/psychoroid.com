'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { Navbar } from '@/components/design/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { Footer } from '@/components/design/Footer';
import { getStripe } from '@/lib/stripe/stripe';
import { PricingCardProps } from '@/types/components';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase/supabase';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';

// Define the plan type - remove loadingPlan from required props
type PricingPlan = Omit<PricingCardProps, 'onPurchase' | 'isLoading' | 'isLoggedIn' | 'loadingPlan'>;

const isSubscriber = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .rpc('is_active_subscriber', { p_user_id: userId });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error checking subscription status:', error);
        return false;
    }
};

export default function PricingPage() {
    const { user } = useUser();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [customCredits, setCustomCredits] = useState<number>(1000);
    const [isUserSubscribed, setIsUserSubscribed] = useState(false);
    const CREDIT_PRICE = 0.01; // $0.01 per credit
    const { currentLanguage } = useTranslation();

    useEffect(() => {
        const checkSubscription = async () => {
            if (user) {
                const subscribed = await isSubscriber(user.id);
                setIsUserSubscribed(subscribed);
            }
        };

        checkSubscription();
    }, [user]);

    const pricingPlans: PricingPlan[] = [
        {
            name: 'Explore',
            price: 0,
            credits: 200,
            features: [
                '**200 credits on signup**',
                'Limited queue priority',
                '1 task waiting in queue',
                'Assets are under public license',
            ],
            description: 'Try our technology',
            type: 'free' as const
        },
        {
            name: 'Automate',
            price: 24,
            period: 'month',
            credits: 2000,
            features: [
                '**2,000 credits per month**',
                'Standard queue priority',
                '5 tasks waiting in queue',
                'Assets are private & customer owned',
                'Download community assets',
                'AI texture editing',
                'API access'
            ],
            description: 'Best for studios and teams',
            type: 'subscription' as const
        },
        {
            name: 'Scale',
            price: 79,
            period: 'month',
            credits: 6000,
            features: [
                '**6,000 credits per month**',
                'Top queue priority',
                '20 tasks waiting in queue',
                'Assets are private & customer owned',
                'Download community assets',
                'AI texture editing',
                'API access',
                'Free retries',
                'Animate your creations',
            ],
            description: 'Unlock psychoroid.com\'s full potential',
            type: 'subscription' as const
        }
    ];

    // Add one-time purchase options
    const roidsPacks = [
        {
            name: 'Starter Pack',
            price: 9.99,
            credits: 600,
            type: 'one_time'
        },
        {
            name: 'Plus Pack',
            price: 29.99,
            credits: 2000,
            type: 'one_time'
        },
        {
            name: 'Max Pack',
            price: 59.99,
            credits: 5000,
            type: 'one_time'
        }
    ];

    const calculatePrice = (credits: number) => {
        return (credits * CREDIT_PRICE).toFixed(2);
    };

    const handlePurchaseClick = async (plan: typeof pricingPlans[0]) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            setLoadingPlan(plan.name);
            console.log('Starting checkout for plan:', plan.name);

            const packageName = plan.type === 'subscription'
                ? `sub_${plan.name.toLowerCase()}`
                : plan.name.toLowerCase();

            console.log('Package name:', packageName);

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: packageName,
                    userId: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout session');
            }

            console.log('Got session ID:', data.sessionId);

            const stripe = await getStripe();
            if (!stripe) {
                throw new Error('Failed to load Stripe');
            }

            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (error) {
                console.error('Stripe checkout error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleCustomPurchase = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            setLoadingPlan('custom');
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: 'custom',
                    userId: user.id,
                    credits: customCredits,
                    price: calculatePrice(customCredits)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout session');
            }

            const stripe = await getStripe();
            if (!stripe) {
                throw new Error('Failed to load Stripe');
            }

            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (error) {
                console.error('Stripe checkout error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto md:h-[calc(100vh-8rem)] md:overflow-hidden scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16 md:mt-16 md:h-full">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 mb-8">
                        <div className="md:col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">
                                    {t(currentLanguage, 'home.pricing.title')}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {t(currentLanguage, 'home.features.description')}
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-8">
                            <p className="text-xs text-muted-foreground md:pt-2 mt-2">
                                {t(currentLanguage, 'home.pricing.description')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-6 -mx-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 px-4 md:px-0">
                            {pricingPlans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={`
                                        border border-border
                                        md:border-r md:border-t md:border-b md:first:border-l
                                    `}
                                >
                                    <PricingCard
                                        {...plan}
                                        onPurchase={() => handlePurchaseClick(plan)}
                                        isLoggedIn={!!user}
                                        loadingPlan={loadingPlan}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Custom credits box - Separated on mobile, connected on desktop */}
                        {user && (
                            <div className="mt-4 md:mt-0 px-4 md:px-0">
                                <div className={`
                                    border border-border
                                    md:border-t-0 md:border-r md:border-b md:border-l
                                `}>
                                    <div className="p-4 md:py-3 md:px-6 hover:bg-accent/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="space-y-2 md:space-y-1">
                                                <h3 className="text-sm font-medium text-foreground">
                                                    On-demand credits
                                                </h3>
                                                <p className="text-xs text-muted-foreground">1 roid = $0.01</p>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                                <div className="relative w-full md:w-auto">
                                                    <Input
                                                        type="number"
                                                        min="100"
                                                        step="50"
                                                        value={customCredits || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value ? parseInt(e.target.value) : '';
                                                            setCustomCredits(value ? Number(value) : 0);
                                                        }}
                                                        onBlur={(e) => {
                                                            const value = parseInt(e.target.value);
                                                            if (value < 100) {
                                                                setCustomCredits(100);
                                                            }
                                                        }}
                                                        className="w-full md:w-32 text-xs font-medium pr-12 h-8 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="Min. 100"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                        roids
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    = ${calculatePrice(customCredits || 0)}
                                                </span>
                                                <Button
                                                    onClick={handleCustomPurchase}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!isUserSubscribed || loadingPlan === 'custom' || !customCredits || customCredits < 100}
                                                    className="w-full md:w-auto px-6 h-8 transition-all hover:bg-primary hover:text-primary-foreground rounded-none text-xs font-medium"
                                                >
                                                    {loadingPlan === 'custom' ? (
                                                        <span className="flex items-center justify-center">
                                                            Processing...
                                                        </span>
                                                    ) : !isUserSubscribed ? (
                                                        'Subscribe first'
                                                    ) : (
                                                        'Purchase'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
}