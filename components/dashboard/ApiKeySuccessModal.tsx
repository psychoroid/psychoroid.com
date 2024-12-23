'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface ApiKeySuccessModalProps {
    isOpen: boolean
    onClose: () => void
    apiKey: string | null
}

export function ApiKeySuccessModal({ isOpen, onClose, apiKey }: ApiKeySuccessModalProps) {
    const [hasCopied, setHasCopied] = useState(false)
    const { currentLanguage } = useTranslation()

    const handleCopyKey = async () => {
        if (!apiKey) return

        try {
            await navigator.clipboard.writeText(apiKey)
            setHasCopied(true)
            toast.success(t(currentLanguage, 'ui.settings.api.sections.keys.keySuccess.copiedToClipboard'))

            // Reset copy state after 2 seconds
            setTimeout(() => {
                setHasCopied(false)
            }, 2000)
        } catch (error) {
            toast.error(t(currentLanguage, 'ui.settings.api.sections.keys.keySuccess.copyError'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-none">
                <DialogHeader>
                    <DialogTitle>{t(currentLanguage, 'ui.settings.api.sections.keys.keySuccess.title')}</DialogTitle>
                    <DialogDescription>
                        {t(currentLanguage, 'ui.settings.api.sections.keys.keySuccess.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            value={apiKey || ''}
                            readOnly
                            className="font-mono text-xs"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyKey}
                            className="shrink-0"
                        >
                            {hasCopied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, 'ui.settings.api.sections.keys.keySuccess.securityNotice')}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
} 