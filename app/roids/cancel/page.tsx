'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
    const router = useRouter();

    const handleContactSupport = () => {
        window.location.href = 'mailto:dev@psychoroid.com?subject=Payment Support Request';
    };

    return (
        <div className="h-svh bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md p-6 border border-border rounded-lg bg-background/50">
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
                            className="min-w-[120px] border-green-500 dark:border-green-600 text-green-600 dark:text-green-500 hover:bg-green-500/10 dark:hover:bg-green-500/10"
                        >
                            Return to Pricing
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContactSupport}
                            className="min-w-[120px] border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
                        >
                            Contact support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 