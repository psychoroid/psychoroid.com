'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error during auth callback:', error);
                router.push('/auth/sign-in');
                return;
            }

            // Redirect to home page after successful auth
            router.push('/');
            router.refresh();
        };

        handleAuthCallback();
    }, [router]);

    return null; // or a loading spinner
} 