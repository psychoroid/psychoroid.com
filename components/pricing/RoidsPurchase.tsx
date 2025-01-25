'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/lib/contexts/UserContext'
import { getStripe } from '@/lib/stripe/stripe'
import { toast } from 'sonner'

const CREDIT_PRICE = 0.045
const baseUrl = process.env.BUN_ENV === 'production'
    ? 'https://www.psychoroid.com'
    : process.env.NEXT_PUBLIC_APP_URL

export default function RoidsPurchase() {
    const { user } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [customCredits, setCustomCredits] = useState<number>(1000)

    const calculatePrice = (credits: number) => {
        return (credits * CREDIT_PRICE).toFixed(2)
    }

    const handleCustomPurchase = async () => {
        if (!user) {
            toast.error('Please sign in to purchase credits')
            return
        }

        try {
            setIsLoading(true)
            const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: 'custom',
                    userId: user.id,
                    credits: customCredits,
                    price: calculatePrice(customCredits)
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create checkout session')
            }

            const { sessionId } = await response.json()

            const stripe = await getStripe()
            if (!stripe) {
                throw new Error('Failed to load Stripe')
            }

            const { error } = await stripe.redirectToCheckout({ sessionId })
            if (error) {
                throw error
            }
        } catch (error) {
            console.error('❌ Error initiating checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative w-full md:w-auto">
                    <Input
                        type="number"
                        min="100"
                        step="50"
                        value={customCredits || ''}
                        onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : ''
                            setCustomCredits(value ? Number(value) : 0)
                        }}
                        onBlur={(e) => {
                            const value = parseInt(e.target.value)
                            if (value < 100) {
                                setCustomCredits(100)
                            }
                        }}
                        className="w-full md:w-32 text-xs font-medium pr-12 h-8 rounded-none"
                        placeholder="Min. 100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        roids
                    </span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    = ${calculatePrice(customCredits || 0)}
                </span>
                <Button
                    onClick={handleCustomPurchase}
                    variant="outline"
                    size="sm"
                    disabled={isLoading || !customCredits || customCredits < 100}
                    className="w-full md:w-auto px-6 h-8 transition-all hover:bg-primary hover:text-primary-foreground rounded-none text-xs font-medium"
                >
                    {isLoading ? 'Processing...' : 'Purchase'}
                </Button>
            </div>
        </div>
    )
} 