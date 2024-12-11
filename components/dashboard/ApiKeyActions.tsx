'use client'

import { useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    status: 'active' | 'revoked';
    last_used_at: string | null;
    expires_at: string;
    created_at: string;
}

interface ApiKeyActionsProps {
    apiKey: ApiKey | null
    isOpen: boolean
    onClose: () => void
    onRevoke: (prefix: string) => void
    buttonRef: React.RefObject<HTMLButtonElement>
}

export function ApiKeyActions({ apiKey, isOpen, onClose, onRevoke, buttonRef }: ApiKeyActionsProps) {
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose, buttonRef])

    if (!apiKey) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: -10, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.5 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-background border border-border rounded-none shadow-lg z-50"
                >
                    <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <h3 className="font-medium">Revoke API Key</h3>
                                <p className="text-xs text-muted-foreground">
                                    Are you sure you want to revoke this API key? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    onRevoke(apiKey.prefix)
                                    onClose()
                                }}
                                className="rounded-none"
                            >
                                Revoke Key
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 