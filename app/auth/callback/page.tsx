'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the home page after successful authentication
        router.push('/');
    }, [router]);

    return null;
} 