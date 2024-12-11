'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface NewKeyDialogProps {
    isOpen: boolean
    onClose: () => void
    newKey: string | null
    keyName: string
    onKeyNameChange: (name: string) => void
    onGenerateKey: () => void
}

export function NewKeyDialog({ isOpen, onClose, newKey, keyName, onKeyNameChange, onGenerateKey }: NewKeyDialogProps) {
    const handleCopyKey = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey)
            toast.success('API key copied to clipboard')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-none">
                {newKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>New API Key Generated</DialogTitle>
                            <DialogDescription>
                                Make sure to copy your API key now. You won&apos;t be able to see it again!
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
                            <DialogTitle>Generate New API Key</DialogTitle>
                            <DialogDescription>
                                Give your API key a name to help you identify it later.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Key Name</Label>
                                <Input
                                    value={keyName}
                                    onChange={(e) => onKeyNameChange(e.target.value)}
                                    placeholder="e.g., Development, Production"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={onGenerateKey} disabled={!keyName.trim()}>
                                Generate a key
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
} 