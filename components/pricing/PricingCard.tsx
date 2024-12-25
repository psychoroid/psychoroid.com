'use client';

import { Button } from '@/components/ui/button';
import { PricingCardProps } from '@/types/components';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { getLocalizedPrice } from '@/lib/utils/currencyConversions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

export function PricingCard({
    name,
    price,
    period,
    yearlyPrice,
    features,
    description,
    isLoggedIn,
    loadingPlan,
    onPurchase,
    type = 'subscription'
}: PricingCardProps) {
    const isThisPlanLoading = loadingPlan === name;
    const { currentLanguage } = useTranslation();
    const currencySymbol = t(currentLanguage, 'pricing.card.currency') as any;

    // Only convert price for paid plans (Automate and Scale)
    const displayPrice = price === 0 ? 0 :
        getLocalizedPrice(currencySymbol, name.toLowerCase() as 'automate' | 'scale');

    // Get translated features based on plan type
    const getTranslatedFeatures = (): string[] => {
        const planKey = name.toLowerCase();
        const basePath = `pricing.plans.${planKey}.features`;
        return t(currentLanguage, basePath) || features;
    };

    const translatedFeatures = getTranslatedFeatures();

    return (
        <div className="flex flex-col h-full p-4 md:p-6 hover:bg-accent transition-colors">
            <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                    {t(currentLanguage, `pricing.plans.${name.toLowerCase()}.name`) || name}
                </h3>
                <div className="mb-4">
                    {price === 0 ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl md:text-2xl font-semibold text-foreground">
                                    {t(currentLanguage, 'pricing.card.free')}
                                </span>
                                <span className="text-muted-foreground text-xs -translate-y-[1px]">•</span>
                                <span className="text-xs text-muted-foreground">
                                    {t(currentLanguage, 'pricing.card.no_card')}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-start">
                                <span className="text-xs font-medium align-top mt-1.5 mr-0.5">
                                    {t(currentLanguage, 'pricing.card.currency')}
                                </span>
                                <span className="text-2xl font-bold">{displayPrice}</span>
                                {period && (
                                    <span className="text-xs text-muted-foreground ml-1 mt-2">
                                        {t(currentLanguage, `pricing.card.per_${period}`)}
                                    </span>
                                )}
                            </div>
                            {yearlyPrice && (
                                <p className="text-xs text-muted-foreground mt-4 mb-4">
                                    {t(currentLanguage, 'pricing.card.currency')}{yearlyPrice}
                                    {t(currentLanguage, 'pricing.card.per_year')}
                                </p>
                            )}
                        </>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                    {t(currentLanguage, `pricing.plans.${name.toLowerCase()}.description`) || description}
                </p>
            </div>

            <div className="flex-grow">
                <ul className="space-y-3 mb-6">
                    {translatedFeatures.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                            <span className="text-foreground mt-0.5">•</span>
                            <span className="flex-1">
                                {feature.startsWith('**') && feature.endsWith('**') ? (
                                    <span className="font-semibold flex items-center gap-1.5">
                                        {feature.slice(2, -2)}
                                        {index === 0 && name === 'Explore' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <InfoIcon className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        className="p-3 max-w-[110px] bg-background/95 backdrop-blur-sm border border-border/50"
                                                        side="right"
                                                        sideOffset={5}
                                                    >
                                                        <p className="text-xs text-muted-foreground leading-normal">
                                                            {t(currentLanguage, 'pricing.card.credits_tooltip')}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
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
                            {t(currentLanguage, 'pricing.card.processing')}
                        </span>
                    ) : (
                        price === 0
                            ? t(currentLanguage, 'pricing.card.get_started')
                            : t(currentLanguage, 'pricing.card.subscribe')
                    )}
                </Button>
            )}
        </div>
    );
}

