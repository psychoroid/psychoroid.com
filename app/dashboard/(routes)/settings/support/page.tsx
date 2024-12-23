'use client'

import { Card } from '@/components/ui/card'
import SupportForm from '@/components/dashboard/SupportForm'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

export default function SupportPage() {
    const { currentLanguage } = useTranslation()

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                    {t(currentLanguage, 'ui.settings.support.title')}
                </h1>
                <p className="text-xs text-muted-foreground">
                    {t(currentLanguage, 'ui.settings.support.description')}
                </p>
            </div>

            <Card className="border border-border rounded-none bg-card">
                <div className="p-4 sm:p-6">
                    <SupportForm />
                </div>
            </Card>
        </div>
    )
} 