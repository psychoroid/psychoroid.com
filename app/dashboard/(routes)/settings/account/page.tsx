'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'

export default function AccountSettings() {
    const { user } = useUser()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const isOAuthUser = Boolean(user?.app_metadata?.provider && ['github', 'google'].includes(user.app_metadata.provider))

    // Initialize form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: ''
    })

    const [currentEmail] = useState(user?.email || '')

    // Update form data when user data is available
    useEffect(() => {
        if (user) {
            let firstName = user.user_metadata?.first_name
            let lastName = user.user_metadata?.last_name

            if (!firstName && !lastName && user.user_metadata?.full_name) {
                [firstName, lastName] = user.user_metadata.full_name.split(' ')
            }

            setFormData({
                firstName: firstName || '',
                lastName: lastName || '',
                email: user.email || '',
                company: user.user_metadata?.company || ''
            })
        }
    }, [user])

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true)

            // If email has changed and user is not OAuth
            if (formData.email !== currentEmail && !isOAuthUser) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: formData.email
                })

                if (emailError) throw emailError

                toast.success('Verification email sent', {
                    description: 'Please check your new email inbox to confirm the change'
                })
            }

            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    company: formData.company
                }
            })

            if (updateError) throw updateError

            if (!isOAuthUser || formData.email === currentEmail) {
                toast.success('Profile updated successfully')
            }

        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile', {
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true)

            // First, delete user data
            const { error: deleteDataError } = await supabase
                .from('user_roids')
                .delete()
                .eq('user_id', user?.id)

            if (deleteDataError) {
                throw deleteDataError
            }

            // Delete the user through an API endpoint since we need admin rights
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id
                })
            })

            if (!response.ok) {
                throw new Error('Failed to delete account')
            }

            // Sign out locally
            await supabase.auth.signOut()
            router.push('/')

        } catch (error: any) {
            console.error('Error deleting account:', error)
            toast.error('Failed to delete account', {
                description: error.message
            })
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
                            disabled={isOAuthUser}
                        />
                        <p className="text-xs text-muted-foreground">
                            {isOAuthUser
                                ? `Email managed by ${user?.app_metadata?.provider === 'github' ? 'Github' : 'Google'}. Cannot be changed.`
                                : 'This will be used for notifications and login.'}
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
                        className="rounded-none bg-blue-500 hover:bg-blue-600 text-white h-9 px-4 sm:h-10 sm:px-6 w-full sm:w-auto"
                    >
                        {isLoading ? 'Updating...' : 'Update'}
                    </Button>
                </div>
            </Card>

            <Card className="border border-border rounded-none bg-card mt-8">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be wary of the following features as they cannot be undone.
                    </p>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="rounded-none bg-red-500 hover:bg-red-600"
                            >
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove all your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-none bg-red-500 hover:bg-red-600"
                                    onClick={handleDeleteAccount}
                                >
                                    {isLoading ? 'Deleting...' : 'Delete Account'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </Card>
        </div>
    )
} 