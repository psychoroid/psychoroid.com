'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
import { format } from 'date-fns'

interface ApiKey {
    id: string
    name: string
    prefix: string
    status: 'active' | 'revoked'
    last_used_at: string | null
    expires_at: string
    created_at: string
}

export default function ApiSettings() {
    const { user } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [keyName, setKeyName] = useState('')
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [newKey, setNewKey] = useState<string | null>(null)

    useEffect(() => {
        fetchApiKeys()
    }, [])

    const fetchApiKeys = async () => {
        if (!user?.id) return

        const { data, error } = await supabase.rpc('list_api_keys', {
            p_user_id: user.id
        })

        if (error) {
            toast.error('Failed to fetch API keys')
            return
        }

        setApiKeys(data)
    }

    const handleGenerateKey = async () => {
        if (!keyName.trim()) {
            toast.error('Please enter a key name')
            return
        }

        setIsLoading(true)
        try {
            const { data, error } = await supabase.rpc('generate_api_key', {
                p_user_id: user?.id,
                p_name: keyName.trim()
            })

            if (error) throw error

            setNewKey(data.key)
            setKeyName('')
            fetchApiKeys()
            toast.success('New API key generated')
        } catch (error) {
            console.error('Error generating API key:', error)
            toast.error('Failed to generate API key')
        } finally {
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
            toast.success('API key revoked')
        } catch (error) {
            console.error('Error revoking API key:', error)
            toast.error('Failed to revoke API key')
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
                <div className="p-6 space-y-6">
                    {newKey && (
                        <div className="p-4 bg-accent space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">New API Key Generated</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNewKey(null)}
                                    className="rounded-none"
                                >
                                    Close
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newKey}
                                    readOnly
                                    className="font-mono text-xs rounded-none"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newKey)
                                        toast.success('API key copied to clipboard')
                                    }}
                                    className="rounded-none shrink-0"
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Make sure to copy your API key now. You won't be able to see it again!
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Generate a key</label>
                            <div className="flex gap-2">
                                <Input
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="API key name (e.g., Development, Production)"
                                    className="rounded-none"
                                />
                                <Button
                                    onClick={handleGenerateKey}
                                    disabled={isLoading || !keyName.trim()}
                                    className="rounded-none shrink-0"
                                >
                                    {isLoading ? 'Generating...' : 'Generate'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Your keys</label>
                            <div className="border border-border rounded-none divide-y divide-border">
                                {apiKeys.map((key) => (
                                    <div key={key.id} className="p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{key.name}</p>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                •••••{key.prefix}
                                            </p>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                <span>Created {format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                                                •
                                                <span>Expires {format(new Date(key.expires_at), 'MMM d, yyyy')}</span>
                                                •
                                                <span className={key.status === 'active' ? 'text-emerald-500' : 'text-red-500'}>
                                                    {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        {key.status === 'active' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRevokeKey(key.prefix)}
                                                className="rounded-none"
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {apiKeys.length === 0 && (
                                    <p className="p-4 text-sm text-muted-foreground">
                                        No keys generated yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
} 