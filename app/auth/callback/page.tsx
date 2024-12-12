'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import Loader from '@/components/design/loader';

export default function AuthCallbackPage() {
    const router = useRouter();

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

                    // If no profile exists, it will be created automatically by the database trigger
                    if (!profile) {
                        console.log('Profile will be created by database trigger');
                    }
                }

                // Redirect to home page after successful auth
                router.push('/');
                router.refresh();
            } catch (error) {
                console.error('Unexpected error during auth callback:', error);
                router.push('/auth/sign-in');
            }
        };

        handleAuthCallback();
    }, [router]);

    return <Loader />;
} 