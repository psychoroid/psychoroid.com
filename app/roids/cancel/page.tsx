'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useEffect, useRef } from 'react';

const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.psychoroid.com'
    : process.env.NEXT_PUBLIC_APP_URL;

export default function CancelPage() {
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const hasCancelAttempted = useRef(false);

    useEffect(() => {
        const cancelSession = async () => {
            if (sessionId && user) {
                try {
                    const response = await fetch(`${baseUrl}/api/stripe/cancel-session`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sessionId,
                            userId: user.id
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to cancel session');
                    }

                    console.log('✅ Payment cancelled successfully');
                } catch (error) {
                    console.error('❌ Error cancelling session:', error);
                }
            }
        };

        if (sessionId && user && !hasCancelAttempted.current) {
            hasCancelAttempted.current = true;
            cancelSession();
        }
    }, [sessionId, user]);

    return (
        <div className="h-svh bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md p-6 border border-border rounded-none bg-background/50">
                <div className="flex flex-col items-center space-y-4">
                    <XCircle className="h-12 w-12 text-red-500" />

                    <h1 className="text-xl font-semibold text-foreground">
                        Payment Cancelled
                    </h1>

                    <p className="text-sm text-muted-foreground text-center">
                        Your payment was cancelled. No charges were made.
                    </p>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/pricing')}
                            className="min-w-[120px] rounded-none border-green-500 dark:border-green-600 text-green-600 dark:text-green-500 hover:bg-green-500/10 dark:hover:bg-green-500/10"
                        >
                            Return to Pricing
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard/settings/support')}
                            className="min-w-[120px] rounded-none border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
                        >
                            Contact support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 