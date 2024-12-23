'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function AccountForm() {
    const { user } = useUser()
    const router = useRouter()
    const { currentLanguage } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const isOAuthUser = Boolean(user?.app_metadata?.provider && ['github', 'google'].includes(user.app_metadata.provider))

    // Initialize form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        birthdate: '',
        username: ''
    })

    const [currentEmail] = useState(user?.email || '')

    // Update form data when user data is available
    useEffect(() => {
        if (user) {
            let firstName = user.user_metadata?.first_name
            let lastName = user.user_metadata?.last_name

            // For OAuth users, get name from provider data
            if (isOAuthUser) {
                if (user.app_metadata?.provider === 'google') {
                    firstName = user.user_metadata?.full_name?.split(' ')[0] || firstName
                    lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || lastName
                } else if (user.app_metadata?.provider === 'github') {
                    firstName = user.user_metadata?.name?.split(' ')[0] || firstName
                    lastName = user.user_metadata?.name?.split(' ').slice(1).join(' ') || lastName
                }
            }
            // For regular users, try to split full_name if first/last name not available
            else if (!firstName && !lastName && user.user_metadata?.full_name) {
                [firstName, lastName] = user.user_metadata.full_name.split(' ')
            }

            setFormData({
                firstName: firstName || '',
                lastName: lastName || '',
                email: user.email || '',
                company: user.user_metadata?.organization || user.user_metadata?.company || '',
                birthdate: user.user_metadata?.birthdate || '',
                username: user.user_metadata?.username || ''
            })

            // Fetch additional data from profiles table
            const fetchProfileData = async () => {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('organization, birthdate, full_name')
                    .eq('id', user.id)
                    .single()

                if (!error && profile) {
                    // Only update if not OAuth user or fields are empty
                    if (!isOAuthUser || (!firstName && !lastName && profile.full_name)) {
                        const [profileFirstName, ...profileLastName] = (profile.full_name || '').split(' ')
                        setFormData(prev => ({
                            ...prev,
                            firstName: prev.firstName || profileFirstName || '',
                            lastName: prev.lastName || profileLastName.join(' ') || '',
                            company: profile.organization || prev.company,
                            birthdate: profile.birthdate ? format(new Date(profile.birthdate), 'dd/MM/yyyy') : prev.birthdate
                        }))
                    }
                }
            }

            fetchProfileData()
        }
    }, [user, isOAuthUser])

    const validateBirthdate = (value: string) => {
        const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/
        if (!regex.test(value)) return false

        const [day, month, year] = value.split('/')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date <= new Date() && date.getFullYear() >= 1900
    }

    const formatDateInput = (value: string) => {
        // Remove any non-digit characters
        const numbers = value.replace(/\D/g, '')

        // Format as DD/MM/YYYY
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true)

            if (formData.birthdate && !validateBirthdate(formData.birthdate)) {
                toast.error(t(currentLanguage, 'ui.settings.account.errors.invalidBirthdate'))
                return
            }

            // If email has changed and user is not OAuth
            if (formData.email !== currentEmail && !isOAuthUser) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: formData.email
                })

                if (emailError) throw emailError

                toast.success(t(currentLanguage, 'ui.settings.account.success.emailVerification'), {
                    description: t(currentLanguage, 'ui.settings.account.success.emailVerificationDesc')
                })
            }

            // Update profile details using the new RPC
            const { error: profileError } = await supabase.rpc('update_user_profile_details', {
                p_first_name: formData.firstName,
                p_last_name: formData.lastName,
                p_birthdate: formData.birthdate,
                p_organization: formData.company,
                p_username: formData.username
            })

            if (profileError) throw profileError

            // Refresh the session to get updated user data
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) throw refreshError

            if (!isOAuthUser || formData.email === currentEmail) {
                toast.success(t(currentLanguage, 'ui.settings.account.success.profileUpdated'))
            }

        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error(t(currentLanguage, 'ui.settings.account.errors.updateFailed'), {
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-2 max-w-md">
                <div className="space-y-2 mb-4">
                    <div className="flex gap-4">
                        <div className="grid gap-2 w-1/2">
                            <label className="text-sm font-medium">
                                {t(currentLanguage, 'ui.settings.account.fields.firstName')}
                            </label>
                            <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="rounded-none"
                                disabled={isOAuthUser}
                            />
                        </div>
                        <div className="grid gap-2 w-1/2">
                            <label className="text-sm font-medium">
                                {t(currentLanguage, 'ui.settings.account.fields.lastName')}
                            </label>
                            <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="rounded-none"
                                disabled={isOAuthUser}
                            />
                        </div>
                    </div>

                    {isOAuthUser && (
                        <p className="text-xs text-muted-foreground">
                            {t(currentLanguage, `ui.settings.account.hints.nameManaged.${user?.app_metadata?.provider === 'github' ? 'github' : 'google'}`)}
                        </p>
                    )}
                </div>

                <div className="grid gap-2 mb-4">
                    <label className="text-sm font-medium">
                        {t(currentLanguage, 'ui.settings.account.fields.email')}
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="max-w-md rounded-none"
                        disabled={isOAuthUser}
                    />
                    <p className="text-xs text-muted-foreground">
                        {isOAuthUser
                            ? t(currentLanguage, `ui.settings.account.hints.emailManaged.${user?.app_metadata?.provider === 'github' ? 'github' : 'google'}`)
                            : t(currentLanguage, 'ui.settings.account.hints.emailUsage')}
                    </p>
                </div>

                <div className="grid gap-2 mb-4">
                    <label className="text-sm font-medium">
                        {t(currentLanguage, 'ui.settings.account.fields.username')}
                    </label>
                    <div className="relative max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                        </span>
                        <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="pl-8 rounded-none"
                            placeholder="your-username"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, 'ui.settings.account.hints.usernameHint')}
                    </p>
                </div>

                <div className="grid gap-2 mb-4">
                    <label className="text-sm font-medium">
                        {t(currentLanguage, 'ui.settings.account.fields.organization')}
                    </label>
                    <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="max-w-md rounded-none"
                        placeholder={t(currentLanguage, 'ui.settings.account.hints.organizationPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, 'ui.settings.account.hints.organizationHint')}
                    </p>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">
                        {t(currentLanguage, 'ui.settings.account.fields.birthdate')}
                    </label>
                    <Input
                        value={formData.birthdate}
                        onChange={(e) => {
                            const formatted = formatDateInput(e.target.value)
                            if (formatted.length <= 10) {
                                setFormData({ ...formData, birthdate: formatted })
                            }
                        }}
                        className="max-w-md rounded-none"
                        placeholder={t(currentLanguage, 'ui.settings.account.hints.birthdateFormat')}
                        maxLength={10}
                    />
                </div>

                <div className="flex items-start gap-2 mt-6 pb-6 border-b border-border">
                    <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, 'ui.settings.account.hints.supportText')}
                        <span className="text-blue-500 hover:text-blue-600">
                            dev@psychoroid.com
                        </span>
                    </p>
                </div>

                <Button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4 sm:h-10 sm:px-6 w-full sm:w-auto"
                >
                    {isLoading
                        ? t(currentLanguage, 'ui.settings.account.buttons.updating')
                        : t(currentLanguage, 'ui.settings.account.buttons.update')}
                </Button>
            </div>

            <DangerZone />
        </div>
    )
}

function DangerZone() {
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [showConfirmInput, setShowConfirmInput] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { currentLanguage } = useTranslation()
    const { user } = useUser()

    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true)

            if (!user?.id) {
                throw new Error('No user found')
            }

            // Get fresh session
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No active session')
            }

            // Debug logging
            console.log('Attempting to delete user:', user.id)
            console.log('Session exists:', !!session)
            console.log('Access token exists:', !!session.access_token)

            // Delete the user through API
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id
                }),
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('Delete response:', data)
                console.error('Response status:', response.status)
                throw new Error(data.error || 'Failed to delete account')
            }

            // Sign out from Supabase
            await supabase.auth.signOut()

            // Show success message
            toast.success(t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.success'))

            // Redirect to home page
            window.location.href = '/'

        } catch (error: any) {
            console.error('Error deleting account:', error)
            toast.error(t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.error'), {
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    const isDeleteConfirmed = deleteConfirmation === 'delete my account'

    return (
        <Card className="border border-destructive/20 rounded-none bg-card mt-8">
            <div className="p-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-red-500">
                            {t(currentLanguage, 'ui.settings.account.dangerZone.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t(currentLanguage, 'ui.settings.account.dangerZone.description')}
                        </p>
                    </div>

                    <div className="border-t border-border my-4" />

                    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="rounded-none bg-red-500 hover:bg-red-600"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                {t(currentLanguage, 'ui.settings.account.dangerZone.deleteButton')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.title')}
                                </AlertDialogTitle>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <AlertDialogDescription className="text-sm text-muted-foreground">
                                        {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.description')}
                                    </AlertDialogDescription>
                                    <ul className="list-disc list-inside space-y-1">
                                        {(t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.consequences') || '').split('\n').filter(Boolean).map((consequence: string, index: number) => (
                                            <li key={index}>{consequence}</li>
                                        ))}
                                    </ul>
                                    {showConfirmInput && (
                                        <div className="mt-4 space-y-2">
                                            <label className="text-sm font-medium text-destructive block">
                                                {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.typeConfirm')}
                                            </label>
                                            <Input
                                                value={deleteConfirmation}
                                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                placeholder=""
                                                className="rounded-none border-destructive/50 focus:border-destructive"
                                            />
                                        </div>
                                    )}
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    className="rounded-none"
                                    onClick={() => {
                                        setShowConfirmInput(false)
                                        setDeleteConfirmation('')
                                    }}
                                >
                                    {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.buttons.cancel')}
                                </AlertDialogCancel>
                                {!showConfirmInput ? (
                                    <Button
                                        variant="destructive"
                                        className="rounded-none bg-red-500 hover:bg-red-600"
                                        onClick={() => setShowConfirmInput(true)}
                                    >
                                        {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.buttons.continue')}
                                    </Button>
                                ) : (
                                    <AlertDialogAction
                                        className="rounded-none bg-red-500 hover:bg-red-600"
                                        onClick={handleDeleteAccount}
                                        disabled={!isDeleteConfirmed || isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                {t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.buttons.deleting')}
                                            </div>
                                        ) : (
                                            t(currentLanguage, 'ui.settings.account.dangerZone.deleteConfirm.buttons.delete')
                                        )}
                                    </AlertDialogAction>
                                )}
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </Card>
    )
} 