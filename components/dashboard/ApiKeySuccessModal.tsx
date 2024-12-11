'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ApiKeySuccessModalProps {
    isOpen: boolean
    onClose: () => void
    apiKey: string | null
}

export function ApiKeySuccessModal({ isOpen, onClose, apiKey }: ApiKeySuccessModalProps) {
    const [hasCopied, setHasCopied] = useState(false)

    const handleCopyKey = async () => {
        if (!apiKey) return

        try {
            await navigator.clipboard.writeText(apiKey)
            setHasCopied(true)
            toast.success('API key copied to clipboard')

            // Reset copy state after 2 seconds
            setTimeout(() => {
                setHasCopied(false)
            }, 2000)
        } catch (error) {
            toast.error('Failed to copy API key')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-none">
                <DialogHeader>
                    <DialogTitle>API Key Generated</DialogTitle>
                    <DialogDescription>
                        Make sure to copy your API key now. You won't be able to see it again!
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
                        Please store this key securely. Anybody can get full access to your account through the API.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
} 