'use client';

import { Button } from '@/components/ui/button';
import { PricingCardProps } from '@/types/components';

export function PricingCard({
    name,
    price,
    discountedPrice,
    period,
    yearlyPrice,
    credits,
    features,
    description,
    subtitle,
    isLoading,
    isLoggedIn,
    loadingPlan,
    onPurchase
}: PricingCardProps) {
    const isThisPlanLoading = loadingPlan === name;

    return (
        <div className="flex flex-col h-full p-4 md:p-6 hover:bg-accent transition-colors">
            <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">{name}</h3>
                <div className="mb-4">
                    {price === 0 ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl md:text-2xl font-semibold text-foreground">
                                    Free
                                </span>
                                <span className="text-muted-foreground text-xs -translate-y-[1px]">•</span>
                                <span className="text-xs text-muted-foreground">
                                    No credit card needed
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-start">
                                <span className="text-xs font-medium align-top mt-1.5 mr-0.5">$</span>
                                <span className="text-2xl font-bold">{price}</span>
                                {period && (
                                    <span className="text-xs text-muted-foreground ml-1 mt-2">
                                        / {period}
                                    </span>
                                )}
                            </div>
                            {yearlyPrice && (
                                <p className="text-xs text-muted-foreground mt-4 mb-4">${yearlyPrice}/ year</p>
                            )}
                        </>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mb-6">{description}</p>
            </div>

            <div className="flex-grow">
                <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                            <span className="text-foreground mt-0.5">•</span>
                            <span className="flex-1">
                                {feature.startsWith('**') && feature.endsWith('**') ? (
                                    <span className="font-semibold">
                                        {feature.slice(2, -2)}
                                    </span>
                                ) : (
                                    feature
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {(!isLoggedIn || price > 0) && (
                <Button
                    onClick={onPurchase}
                    variant="outline"
                    size="default"
                    disabled={isThisPlanLoading}
                    className="w-full hover:bg-foreground hover:text-background transition-colors rounded-none text-xs font-medium"
                >
                    {isThisPlanLoading ? (
                        <span className="flex items-center justify-center">
                            Processing...
                        </span>
                    ) : (
                        price === 0 ? 'Get Started' : 'Subscribe'
                    )}
                </Button>
            )}
        </div>
    );
}

