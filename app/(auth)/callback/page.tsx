'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import { toast } from '@/lib/hooks/use-toast';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentLanguage } = useTranslation();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const token = searchParams.get('token');
            const type = searchParams.get('type');

            if (!token) {
                console.error('No token found in URL');
                router.push('/sign-in');
                return;
            }

            try {
                if (type === 'recovery') {
                    // For password reset, verify the token directly
                    const { data, error } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: 'recovery',
                    });
                    if (error) throw error;

                    // After successful verification, get the session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) throw sessionError;

                    if (session) {
                        // Redirect to reset password page
                        router.push('/reset-password');
                        return;
                    }
                    throw new Error('No session after recovery verification');
                }

                // Handle email verification
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'signup',
                });
                if (error) throw error;

                // Get the session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session) {
                    // Initialize user profile if needed
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (!profile) {
                        const { error: insertError } = await supabase.from('profiles').insert([
                            {
                                id: session.user.id,
                                email: session.user.email,
                                full_name: session.user.user_metadata.full_name,
                            },
                        ]);
                        if (insertError) throw insertError;
                    }

                    router.push('/');
                } else {
                    router.push('/sign-in');
                }
            } catch (error) {
                console.error('Error in auth callback:', error);
                toast({
                    title: t(currentLanguage, 'auth.pages.reset_password.error.title'),
                    description: t(currentLanguage, 'auth.pages.reset_password.error.description'),
                    variant: "destructive",
                });
                router.push('/sign-in');
            }
        };

        handleAuthCallback();
    }, [router, searchParams, currentLanguage]);

    return null;
} 