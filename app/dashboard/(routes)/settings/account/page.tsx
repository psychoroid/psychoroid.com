'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'

export default function AccountSettings() {
    const { user } = useUser()
    const [isLoading, setIsLoading] = useState(false)

    // Split full name into first and last name
    const fullName = user?.user_metadata?.full_name || ''
    const [firstName, lastName] = fullName.split(' ')

    const [formData, setFormData] = useState({
        firstName: firstName || '',
        lastName: lastName || '',
        email: user?.email || '',
        company: user?.user_metadata?.company || ''
    })

    const handleUpdateProfile = async () => {
        setIsLoading(true)
        try {
            // Use the RPC function to update profile
            const { error: rpcError } = await supabase.rpc('update_user_profile', {
                p_first_name: formData.firstName,
                p_last_name: formData.lastName,
                p_company: formData.company
            })

            if (rpcError) throw rpcError

            // Update email separately using auth.updateUser
            if (formData.email !== user?.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: formData.email
                })
                if (emailError) throw emailError
            }

            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-6">
                <h1 className="text-xl font-semibold text-foreground">Account settings</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your account information
                </p>
            </div>

            <Card className="border border-border rounded-none bg-card">
                <div className="p-6 space-y-6">
                    <div className="grid gap-2 max-w-md">
                        <div className="flex gap-4">
                            <div className="grid gap-2 w-1/2">
                                <label className="text-sm font-medium">First name</label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="rounded-none"
                                />
                            </div>
                            <div className="grid gap-2 w-1/2">
                                <label className="text-sm font-medium">Last name</label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="rounded-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="max-w-md rounded-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be used for notifications and login.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Organization</label>
                        <Input
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="max-w-md rounded-none"
                            placeholder="Your organization name"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be used for billing purposes.
                        </p>
                    </div>

                    <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="rounded-none"
                    >
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </Card>
        </div>
    )
} 