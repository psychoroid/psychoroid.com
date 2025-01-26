'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-foreground">Something went wrong</h1>
                <p className="text-sm text-muted-foreground max-w-md">
                    An unexpected error.
                </p>
                <div className="flex justify-center space-x-4 pt-4">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center h-9 rounded-none px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center h-9 rounded-none px-4 py-2 text-sm font-medium text-white transition-colors bg-[#D73D57] hover:bg-[#D73D57]/90 focus:outline-none"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
} 