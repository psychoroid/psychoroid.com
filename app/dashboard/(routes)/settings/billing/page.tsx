'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { RoidsBalance } from '@/components/pricing/RoidsBalance'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.psychoroid.com'
    : process.env.NEXT_PUBLIC_APP_URL;

interface SubscriptionDetails {
    type: string | null
    status: string | null
    periodEnd: string | null
    nextBilling: number | null
}

export default function BillingSettings() {
    const { user } = useUser()
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
                    toast.error('Failed to load subscription details')
                }
            }
        }

        checkSubscription()
    }, [user?.id])

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
                throw new Error(error.error || 'Failed to access billing portal')
            }

            const { url } = await response.json()
            if (!url) {
                throw new Error('No URL returned from billing portal')
            }

            window.location.href = url
        } catch (error) {
            console.error('❌ Error accessing billing portal:', error)
            toast.error('Failed to access billing portal')
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
                throw new Error(error.error || 'Failed to access billing portal');
            }

            const { url } = await response.json();
            if (!url) {
                throw new Error('No URL returned from billing portal');
            }

            window.location.href = url;
        } catch (error) {
            console.error('❌ Error accessing billing portal:', error);
            toast.error('Failed to access billing portal');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-xl font-semibold text-foreground">Billing and subscription</h1>
                <p className="text-xs text-muted-foreground">
                    Your subscription details and credits balance
                </p>
            </div>

            <Card className="border border-border rounded-none bg-card">
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2">Current balance</h3>
                            <RoidsBalance />
                        </div>

                        <div className="h-px bg-border" />

                        <div>
                            <h3 className="text-sm font-medium mb-2">Subscription</h3>
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            {isSubscribed
                                                ? `${subscriptionDetails.type?.toUpperCase()} Plan`
                                                : 'Free Plan'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isSubscribed
                                                ? subscriptionDetails.status === 'active'
                                                    ? `Next billing on ${subscriptionDetails.periodEnd
                                                        ? format(new Date(subscriptionDetails.periodEnd), 'MMM d, yyyy')
                                                        : '...'}`
                                                    : 'Subscription ending soon'
                                                : 'Upgrade to get more credits and features.'}
                                        </p>
                                    </div>
                                    {isSubscribed && subscriptionDetails.type !== 'scale' && (
                                        <div className="text-xs text-muted-foreground">
                                            <p>• Cancel anytime with prorated refund</p>
                                            <p>• Instant access to enterprise features</p>
                                            <p>• Priority support</p>
                                        </div>
                                    )}
                                    {isSubscribed && subscriptionDetails.type === 'scale' && (
                                        <div className="text-xs text-muted-foreground">
                                            <p>• Unlimited API calls</p>
                                            <p>• Enterprise support</p>
                                            <p>• Custom integrations</p>
                                            <p>• Dedicated account manager</p>
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
                                            {isLoading ? 'Loading...' : 'Manage Billing'}
                                        </Button>
                                    )}

                                    <Button
                                        onClick={isSubscribed ? handleManageSubscription : handleSubscribe}
                                        disabled={isLoading}
                                        className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white"
                                    >
                                        {isLoading
                                            ? 'Processing...'
                                            : isSubscribed
                                                ? 'Manage Subscription'
                                                : 'Upgrade'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
} 