'use client';

import { Button } from '@/components/ui/button';
import { PricingCardProps } from '@/types/components';

export function PricingCard({ name, roids, price, onPurchase }: PricingCardProps) {
    return (
        <div className="flex flex-col justify-between h-[160px] p-4 border border-border rounded-lg hover:bg-accent transition-colors">
            <div>
                <h3 className="text-sm font-medium text-foreground mb-3">{name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-sm font-semibold text-foreground">{roids.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">ROIDS</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                    ${price.toFixed(2)}
                </p>
            </div>

            <Button
                onClick={onPurchase}
                variant="outline"
                size="sm"
                className="w-full hover:bg-foreground hover:text-background transition-colors"
            >
                Purchase
            </Button>
        </div>
    );
}

