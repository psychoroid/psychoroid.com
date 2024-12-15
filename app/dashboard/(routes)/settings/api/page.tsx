'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
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

export default function ApiSettings() {
    const { user } = useUser()
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
            toast.error('Failed to fetch API keys', {
                description: error.message
            })
            return
        }

        setApiKeys(data)
    }, [user?.id])

    useEffect(() => {
        fetchApiKeys()
    }, [fetchApiKeys])

    const handleGenerateKey = async () => {
        if (!user) {
            toast.error('Please sign in to purchase credits')
            return
        }

        const activeKeys = apiKeys.filter(key => key.status === 'active').length
        if (activeKeys >= MAX_API_KEYS) {
            toast.error('API key limit reached', {
                description: `You can only have ${MAX_API_KEYS} active API keys at a time.`
            })
            return
        }

        if (!keyName.trim()) {
            toast.error('Please enter a key name', {
                description: 'A name is required to generate a new API key'
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
                throw new Error('Invalid response format from server')
            }
        } catch (error) {
            console.error('Error generating API key:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to generate API key')
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
            toast.success('API key revoked', {
                description: 'The API key has been successfully revoked'
            })
        } catch (error: any) {
            console.error('Error revoking API key:', error)
            toast.error('Failed to revoke API key', {
                description: error.message
            })
        }
    }

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-6">
                <h1 className="text-xl font-semibold text-foreground">Developer settings</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your API keys and integrations
                </p>
            </div>

            <Card className="border border-border rounded-none bg-card">
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <label className="text-sm font-medium">Your keys</label>
                            <Button
                                onClick={() => setIsLoading(true)}
                                className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4 sm:h-10 sm:px-6 w-full sm:w-auto"
                                disabled={apiKeys.filter(key => key.status === 'active').length >= MAX_API_KEYS}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Generate a key
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
                                                        <span>Created {format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                                                        •
                                                        <span>Expires {format(new Date(key.expires_at), 'MMM d, yyyy')}</span>
                                                        •
                                                        <span className="text-emerald-500">
                                                            Active
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
                                                    Revoke
                                                </Button>
                                            </div>
                                        ))}
                                    {apiKeys.filter(key => key.status === 'active').length === 0 && (
                                        <p className="p-4 text-sm text-muted-foreground">
                                            No keys generated yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {apiKeys.filter(key => key.status === 'active').length >= MAX_API_KEYS && (
                            <p className="text-xs text-muted-foreground">
                                You have reached the maximum number of active API keys ({MAX_API_KEYS}).
                            </p>
                        )}
                    </div>
                </div>
            </Card>

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