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
    onPurchase
}: PricingCardProps) {
    return (
        <div className="flex flex-col h-full p-6 hover:bg-accent transition-colors">
            <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">{name}</h3>
                <div className="mb-4">
                    {price === 0 ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold text-foreground">
                                    Free
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4 mb-4">No credit card needed</p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold text-foreground">
                                    ${discountedPrice || price}
                                </span>
                                <span className="text-xs text-muted-foreground">/ month</span>
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
                            <span className="text-foreground">•</span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button
                onClick={onPurchase}
                variant="outline"
                size="sm"
                className="w-full hover:bg-foreground hover:text-background transition-colors"
            >
                {price === 0 ? 'Get Started' : 'Subscribe'}
            </Button>
        </div>
    );
}

