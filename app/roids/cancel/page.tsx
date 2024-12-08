'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to pricing after 5 seconds
        const timeout = setTimeout(() => {
            router.push('/pricing');
        }, 5000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-center mb-6">
                    <XCircle className="w-16 h-16 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Purchase Cancelled</h1>
                <p className="text-gray-300 mb-6">
                    Your purchase was cancelled. No charges were made to your account.
                </p>
                <button
                    onClick={() => router.push('/pricing')}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Return to Pricing
                </button>
            </div>
        </div>
    );
} 