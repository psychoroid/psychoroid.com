'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className="h-svh bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md p-6 border border-border rounded-none bg-background/50">
                <div className="flex flex-col items-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />

                    <h1 className="text-xl font-semibold text-foreground">
                        Payment Successful
                    </h1>

                    <div className="text-sm text-muted-foreground text-center space-y-2">
                        <p>Thank you so much for your purchase.</p>
                        <p>Your ROIDS balance has been updated. You can now start using them and enjoy paid features.</p>
                    </div>

                    <Button
                        onClick={() => router.push('/')}
                        size="sm"
                        className="min-w-[120px] rounded-none bg-green-500 hover:bg-green-600 text-white dark:bg-green-500 dark:hover:bg-green-600"
                    >
                        Get started
                    </Button>
                </div>
            </div>
        </div>
    );
} 