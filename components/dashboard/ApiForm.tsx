'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { format } from 'date-fns'
import { ApiKeyActions } from '@/components/dashboard/ApiKeyActions'
import { NewKeyDialog } from '@/components/dashboard/NewKeyDialog'
import { ApiKeySuccessModal } from '@/components/dashboard/ApiKeySuccessModal'

interface ApiKey {
    id: string
    name: string
    prefix: string
    status: 'active' | 'revoked'
    last_used_at: string | null
    expires_at: string
    created_at: string
}

const MAX_API_KEYS = 3;

export default function ApiForm() {
    const { user } = useUser()
    const { currentLanguage } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [keyName, setKeyName] = useState('')
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [newKey, setNewKey] = useState<string | null>(null)
    const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null)
    const actionButtonRef = useRef<HTMLButtonElement>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    const fetchApiKeys = useCallback(async () => {
        if (!user?.id) return

        const { data, error } = await supabase.rpc('list_api_keys', {
            p_user_id: user.id
        })

        if (error) {
            toast.error(t(currentLanguage, 'ui.settings.api.errors.fetchFailed'), {
                description: error.message
            })
            return
        }

        setApiKeys(data)
    }, [user?.id, currentLanguage])

    useEffect(() => {
        fetchApiKeys()
    }, [fetchApiKeys])

    const handleGenerateKey = async () => {
        if (!user) {
            toast.error(t(currentLanguage, 'ui.settings.api.errors.signInRequired'))
            return
        }

        const activeKeys = apiKeys.filter(key => key.status === 'active').length
        if (activeKeys >= MAX_API_KEYS) {
            toast.error(t(currentLanguage, 'ui.settings.api.errors.limitReached'), {
                description: t(currentLanguage, `ui.settings.api.sections.keys.limitReached.${MAX_API_KEYS}`)
            })
            return
        }

        if (!keyName.trim()) {
            toast.error(t(currentLanguage, 'ui.settings.api.errors.nameRequired'), {
                description: t(currentLanguage, 'ui.settings.api.errors.nameRequiredDesc')
            })
            return
        }

        try {
            setIsLoading(true)
            const { data, error } = await supabase.rpc('generate_api_key', {
                p_user_id: user.id,
                p_name: keyName.trim(),
                p_expires_in: '1 year'
            })

            if (error) throw error

            console.log('API Response:', data)

            if (data && Array.isArray(data) && data[0]?.key) {
                setIsLoading(false)
                setNewKey(data[0].key)
                setShowSuccessModal(true)
                setKeyName('')
                fetchApiKeys()
            } else {
                throw new Error(t(currentLanguage, 'ui.settings.api.errors.invalidResponse'))
            }
        } catch (error) {
            console.error('Error generating API key:', error)
            toast.error(error instanceof Error ? error.message : t(currentLanguage, 'ui.settings.api.errors.generateFailed'))
            setIsLoading(false)
        }
    }

    const handleRevokeKey = async (prefix: string) => {
        try {
            const { error } = await supabase.rpc('revoke_api_key', {
                p_user_id: user?.id,
                p_prefix: prefix
            })

            if (error) throw error

            fetchApiKeys()
            toast.success(t(currentLanguage, 'ui.settings.api.success.keyRevoked'), {
                description: t(currentLanguage, 'ui.settings.api.success.keyRevokedDesc')
            })
        } catch (error: any) {
            console.error('Error revoking API key:', error)
            toast.error(t(currentLanguage, 'ui.settings.api.errors.revokeFailed'), {
                description: error.message
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <label className="text-sm font-medium">
                        {t(currentLanguage, 'ui.settings.api.sections.keys.title')}
                    </label>
                    <Button
                        onClick={() => setIsLoading(true)}
                        className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4 sm:h-10 sm:px-6 w-full sm:w-auto"
                        disabled={apiKeys.filter(key => key.status === 'active').length >= MAX_API_KEYS}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t(currentLanguage, 'ui.settings.api.sections.keys.generateButton')}
                    </Button>
                </div>
                <div className="border border-border rounded-none">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        <div className="divide-y divide-border">
                            {apiKeys
                                .filter(key => key.status === 'active')
                                .map((key) => (
                                    <div key={key.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="space-y-1 flex-grow">
                                            <p className="text-sm font-medium">{key.name}</p>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                •••••{key.prefix}
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    {t(currentLanguage, 'ui.settings.api.sections.keys.created')}{' '}
                                                    {format(new Date(key.created_at), 'MMM d, yyyy')}
                                                </span>
                                                •
                                                <span>
                                                    {t(currentLanguage, 'ui.settings.api.sections.keys.expires')}{' '}
                                                    {format(new Date(key.expires_at), 'MMM d, yyyy')}
                                                </span>
                                                •
                                                <span className="text-emerald-500">
                                                    {t(currentLanguage, 'ui.settings.api.sections.keys.status.active')}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedApiKey(key)
                                                actionButtonRef.current?.click()
                                            }}
                                            className="rounded-none bg-[#D73D57] hover:bg-[#C02B44] text-white h-8 px-3 sm:h-9 sm:px-4 w-full sm:w-auto"
                                        >
                                            {t(currentLanguage, 'ui.settings.api.buttons.revoke')}
                                        </Button>
                                    </div>
                                ))}
                            {apiKeys.filter(key => key.status === 'active').length === 0 && (
                                <p className="p-4 text-sm text-muted-foreground">
                                    {t(currentLanguage, 'ui.settings.api.sections.keys.noKeys')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {apiKeys.filter(key => key.status === 'active').length >= MAX_API_KEYS && (
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, `ui.settings.api.sections.keys.limitReached.${MAX_API_KEYS}`)}
                    </p>
                )}
            </div>

            <NewKeyDialog
                isOpen={isLoading}
                onClose={() => {
                    setNewKey(null)
                    setKeyName('')
                    setIsLoading(false)
                }}
                newKey={newKey}
                keyName={keyName}
                onKeyNameChange={setKeyName}
                onGenerateKey={handleGenerateKey}
            />

            <ApiKeyActions
                apiKey={selectedApiKey}
                isOpen={!!selectedApiKey}
                onClose={() => setSelectedApiKey(null)}
                onRevoke={handleRevokeKey}
                buttonRef={actionButtonRef}
            />

            <ApiKeySuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false)
                    setNewKey(null)
                }}
                apiKey={newKey}
            />
        </div>
    )
} 