import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { Zap, Rocket, Globe } from 'lucide-react';
import { ProductHuntBadge } from '../product-hunt-badge';

export function CompanyDropdown() {
    const { currentLanguage } = useTranslation();

    return (
        <div className="w-fit min-w-[320px] py-2">
            {/* Company Description */}
            <div className="px-4 -pt-6">
                <p className="text-xs text-muted-foreground">
                    {t(currentLanguage, 'dropdowns.psychoroid.description')}
                </p>
            </div>

            <div className="flex justify-between items-start px-4">
                {/* Engine Features */}
                <div className="flex flex-col space-y-2 mt-4">
                    <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                        <Zap className="h-4 w-4 text-[#D73D57]" aria-hidden="true" />
                        <span>{t(currentLanguage, 'dropdowns.engine.instant_conversion')}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                        <Rocket className="h-4 w-4 text-purple-500" aria-hidden="true" />
                        <span>{t(currentLanguage, 'dropdowns.engine.processing_power')}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                        <Globe className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                        <span>{t(currentLanguage, 'dropdowns.engine.export')}</span>
                    </div>
                </div>

                {/* Product Hunt Badge */}
                <div className="mt-8 flex-shrink-0">
                    <ProductHuntBadge productId="animate-ai" />
                </div>
            </div>
        </div>
    );
} 