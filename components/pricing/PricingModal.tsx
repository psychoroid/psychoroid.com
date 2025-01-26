import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { useUser } from '@/lib/contexts/UserContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { getStripe } from '@/lib/stripe/stripe';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
    const { currentLanguage } = useTranslation();
    const { user } = useUser();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const pricingPlans = [
        {
            name: 'Automate',
            price: 15,
            period: 'month',
            credits: 300,
            features: [
                '**300 credits per month**',
                'Standard queue priority',
                '5 tasks waiting in queue',
                'Assets are private & customer owned',
                'Download community assets',
                'AI texture editing',
                'API access'
            ],
            description: t(currentLanguage, 'pricing.plans.automate.description'),
            type: 'subscription' as const
        },
        {
            name: 'Scale',
            price: 45,
            period: 'month',
            credits: 1200,
            features: t(currentLanguage, 'pricing.plans.scale.features'),
            description: t(currentLanguage, 'pricing.plans.scale.description'),
            type: 'subscription' as const
        }
    ];

    const handlePurchase = async (plan: typeof pricingPlans[0]) => {
        if (!user) return;

        try {
            setLoadingPlan(plan.name);
            const packageName = `sub_${plan.name.toLowerCase()}`;

            const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: packageName,
                    userId: user.id,
                    email: user.email,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout session');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error initiating checkout:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 rounded-none border-0 w-[425px] h-[425px] [&>button]:hidden">
                <div className="h-full px-8 py-6 overflow-auto">
                    <div className="flex flex-col space-y-2 text-left mb-6">
                        <h1 className="text-xl font-semibold text-foreground">
                            {t(currentLanguage, 'home.pricing.title')}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {t(currentLanguage, 'home.features.description')}
                        </p>
                    </div>
                    <div className="space-y-4">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className="p-4 border border-border hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-foreground">{plan.name}</h3>
                                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-semibold">${plan.price}</span>
                                        <span className="text-xs text-muted-foreground">/{plan.period}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button
                                        onClick={() => handlePurchase(plan)}
                                        disabled={loadingPlan === plan.name}
                                        className="px-6 h-8 transition-all hover:bg-emerald-500 hover:text-white rounded-none text-xs font-medium border-emerald-500 text-emerald-500 dark:text-emerald-400 dark:border-emerald-400"
                                        variant="outline"
                                    >
                                        {loadingPlan === plan.name ?
                                            t(currentLanguage, 'pricing.on_demand.processing') :
                                            t(currentLanguage, 'pricing.on_demand.purchase')
                                        }
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 