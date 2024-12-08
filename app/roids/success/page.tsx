'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className="h-svh bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md p-6 border border-border rounded-lg bg-background/50">
                <div className="flex flex-col items-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />

                    <h1 className="text-xl font-semibold text-foreground">
                        Payment Successful
                    </h1>

                    <p className="text-sm text-muted-foreground text-center">
                        Your ROIDS balance has been updated. You can now start using them.
                    </p>

                    <Button
                        onClick={() => router.push('/')}
                        size="sm"
                        className="min-w-[120px] bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
                    >
                        Get started
                    </Button>
                </div>
            </div>
        </div>
    );
} 