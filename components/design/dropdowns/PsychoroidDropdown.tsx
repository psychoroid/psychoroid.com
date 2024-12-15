import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { Building2, Sparkles } from 'lucide-react';

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

            {/* Navigation Links */}
            {/* <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Building2 className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    <span>{t(currentLanguage, 'dropdowns.psychoroid.overview')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <span>{t(currentLanguage, 'dropdowns.psychoroid.features')}</span>
                </div>
            </div> */}
        </div>
    );
} 