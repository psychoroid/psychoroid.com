'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface NewKeyDialogProps {
    isOpen: boolean
    onClose: () => void
    newKey: string | null
    keyName: string
    onKeyNameChange: (name: string) => void
    onGenerateKey: () => void
}

export function NewKeyDialog({ isOpen, onClose, newKey, keyName, onKeyNameChange, onGenerateKey }: NewKeyDialogProps) {
    const { currentLanguage } = useTranslation()

    const handleCopyKey = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey)
            toast.success(t(currentLanguage, 'ui.settings.api.sections.keys.newKey.copiedToClipboard'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-none">
                {newKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t(currentLanguage, 'ui.settings.api.sections.keys.newKey.successTitle')}</DialogTitle>
                            <DialogDescription>
                                {t(currentLanguage, 'ui.settings.api.sections.keys.newKey.successDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={newKey}
                                        readOnly
                                        className="font-mono text-xs"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyKey}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t(currentLanguage, 'ui.settings.api.sections.keys.newKey.title')}</DialogTitle>
                            <DialogDescription>
                                {t(currentLanguage, 'ui.settings.api.sections.keys.newKey.description')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>{t(currentLanguage, 'ui.settings.api.sections.keys.newKey.keyName')}</Label>
                                <Input
                                    value={keyName}
                                    onChange={(e) => onKeyNameChange(e.target.value)}
                                    placeholder={t(currentLanguage, 'ui.settings.api.sections.keys.newKey.keyNamePlaceholder')}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={onGenerateKey} disabled={!keyName.trim()}>
                                {t(currentLanguage, 'ui.settings.api.sections.keys.newKey.generateButton')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
} 