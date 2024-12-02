'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // Get the current URL
        const currentUrl = window.location.href;

        // Extract the callback URL from the current URL
        const callbackUrl = currentUrl.replace('/auth/callback', '');

        // Redirect to the callback URL
        router.push(callbackUrl);
    }, [router]);

    return null;
} 