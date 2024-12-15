import { Zap, Rocket, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';

export function EngineDropdown() {
    const { currentLanguage } = useTranslation();

    return (
        <div className="w-fit min-w-[320px] py-2">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Zap className="h-4 w-4 text-[#D73D57]" aria-hidden="true" />
                    <span>{t(currentLanguage, 'dropdowns.engine.instant_conversion')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Rocket className="h-4 w-4 text-purple-500" aria-hidden="true" />
                    <span>{t(currentLanguage, 'dropdowns.engine.processing_power')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Globe className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                    <span>{t(currentLanguage, 'dropdowns.engine.export')}</span>
                </div>
            </div>
        </div>
    );
} 