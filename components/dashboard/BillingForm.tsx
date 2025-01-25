'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { RoidsBalance } from '@/components/pricing/RoidsBalance'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

const baseUrl = process.env.BUN_ENV === 'production'
    ? 'https://www.psychoroid.com'
    : process.env.NEXT_PUBLIC_APP_URL;

interface SubscriptionDetails {
    type: string | null
    status: string | null
    periodEnd: string | null
    nextBilling: number | null
}

export default function BillingForm() {
    const { user } = useUser()
    const { currentLanguage } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails>({
        type: null,
        status: null,
        periodEnd: null,
        nextBilling: null
    })

    useEffect(() => {
        const checkSubscription = async () => {
            if (user?.id) {
                try {
                    const { data: isActive, error: activeError } = await supabase.rpc('is_active_subscriber', {
                        p_user_id: user.id
                    })

                    if (activeError) throw activeError;
                    setIsSubscribed(isActive)

                    const { data: subDetails, error: detailsError } = await supabase.rpc('get_user_subscription_details', {
                        p_user_id: user.id
                    })

                    if (detailsError) throw detailsError;

                    if (subDetails) {
                        setSubscriptionDetails({
                            type: subDetails.subscription_type,
                            status: subDetails.subscription_status,
                            periodEnd: subDetails.subscription_period_end,
                            nextBilling: subDetails.subscription_period_end
                                ? new Date(subDetails.subscription_period_end).getTime()
                                : null
                        })
                    }
                } catch (error) {
                    console.error('❌ Error checking subscription:', error)
                    toast.error(t(currentLanguage, 'ui.settings.billing.errors.loadFailed'))
                }
            }
        }

        checkSubscription()
    }, [user?.id, currentLanguage])

    const handleManageSubscription = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${baseUrl}/api/stripe/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || t(currentLanguage, 'ui.settings.billing.errors.portalAccess'))
            }

            const { url } = await response.json()
            if (!url) {
                throw new Error(t(currentLanguage, 'ui.settings.billing.errors.noPortalUrl'))
            }

            window.location.href = url
        } catch (error) {
            console.error('❌ Error accessing billing portal:', error)
            toast.error(t(currentLanguage, 'ui.settings.billing.errors.portalAccess'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubscribe = () => {
        window.location.href = '/pricing'
    }

    const handleManageBilling = async () => {
        if (!isSubscribed) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/stripe/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t(currentLanguage, 'ui.settings.billing.errors.portalAccess'));
            }

            const { url } = await response.json();
            if (!url) {
                throw new Error(t(currentLanguage, 'ui.settings.billing.errors.noPortalUrl'));
            }

            window.location.href = url;
        } catch (error) {
            console.error('❌ Error accessing billing portal:', error);
            toast.error(t(currentLanguage, 'ui.settings.billing.errors.portalAccess'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium mb-2">
                        {t(currentLanguage, 'ui.settings.billing.sections.balance')}
                    </h3>
                    <RoidsBalance />
                </div>

                <div className="h-px bg-border" />

                <div>
                    <h3 className="text-sm font-medium mb-2">
                        {t(currentLanguage, 'ui.settings.billing.sections.subscription')}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <p className="text-sm">
                                    {isSubscribed
                                        ? t(currentLanguage, `ui.settings.billing.sections.paidPlan.${subscriptionDetails.type?.toLowerCase()}`)
                                        : t(currentLanguage, 'ui.settings.billing.sections.freePlan')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isSubscribed
                                        ? subscriptionDetails.status === 'active'
                                            ? t(currentLanguage, `ui.settings.billing.sections.nextBilling.${format(new Date(subscriptionDetails.periodEnd || ''), 'MMM_d_yyyy')}`)
                                            : t(currentLanguage, 'ui.settings.billing.sections.endingSoon')
                                        : t(currentLanguage, 'ui.settings.billing.sections.upgradeMessage')}
                                </p>
                            </div>
                            {isSubscribed && subscriptionDetails.type !== 'scale' && (
                                <div className="text-xs text-muted-foreground">
                                    {t(currentLanguage, 'ui.settings.billing.sections.features.standard').split('\n').map((feature: string, index: number) => (
                                        <p key={index}>• {feature}</p>
                                    ))}
                                </div>
                            )}
                            {isSubscribed && subscriptionDetails.type === 'scale' && (
                                <div className="text-xs text-muted-foreground">
                                    {t(currentLanguage, 'ui.settings.billing.sections.features.scale').split('\n').map((feature: string, index: number) => (
                                        <p key={index}>• {feature}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {isSubscribed && (
                                <Button
                                    onClick={handleManageBilling}
                                    disabled={isLoading}
                                    className="rounded-none bg-gray-500 hover:bg-gray-600 text-white"
                                >
                                    {isLoading
                                        ? t(currentLanguage, 'ui.settings.billing.buttons.loading')
                                        : t(currentLanguage, 'ui.settings.billing.buttons.manageBilling')}
                                </Button>
                            )}

                            <Button
                                onClick={isSubscribed ? handleManageSubscription : handleSubscribe}
                                disabled={isLoading}
                                className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                {isLoading
                                    ? t(currentLanguage, 'ui.settings.billing.buttons.processing')
                                    : isSubscribed
                                        ? t(currentLanguage, 'ui.settings.billing.buttons.manageSubscription')
                                        : t(currentLanguage, 'ui.settings.billing.buttons.upgrade')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 