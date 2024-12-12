'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import Loader from '@/components/design/loader';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error during auth callback:', error);
                    router.push('/auth/sign-in');
                    return;
                }

                if (session) {
                    // Check if profile exists
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError && profileError.code !== 'PGRST116') {
                        console.error('Error fetching profile:', profileError);
                    }

                    // Initialize profile if it doesn't exist
                    if (!profile) {
                        await supabase.rpc('initialize_user_profile', {
                            p_user_id: session.user.id,
                            p_email: session.user.email
                        });
                    }

                    // Always redirect to home
                    router.push('/');
                    router.refresh();
                } else {
                    router.push('/auth/sign-in');
                }
            } catch (error) {
                console.error('Unexpected error during auth callback:', error);
                router.push('/auth/sign-in');
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    return <Loader />;
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<Loader />}>
            <CallbackContent />
        </Suspense>
    );
} 