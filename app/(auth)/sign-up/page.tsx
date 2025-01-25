'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { supabase } from '@/lib/supabase/supabase';
import { toast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

export default function SignUp() {
    const { currentLanguage } = useTranslation();
    const [isLoading, setIsLoading] = useState(false)
    const [isConfirmationSent, setIsConfirmationSent] = useState(false)
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const handleSignUp = async (data: { email: string; password: string; fullName: string }) => {
        setIsLoading(true);
        setEmail(data.email);
        setErrorMessage('');

        try {
            console.log('Calling supabase.auth.signUp with data:', data);
            const { data: signUpData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName
                    },
                    emailRedirectTo: `${window.location.origin}/callback`,
                },
            });

            console.log('Sign-up response:', signUpData);

            if (error) {
                console.error('Error during sign-up:', error);
                let message = 'An error occurred while creating your account. Please try again.';
                if (error.message.includes('Password should be at least 6 characters')) {
                    message = 'Password should be at least 6 characters long.';
                }
                setErrorMessage(message);
                setIsLoading(false);
            } else {
                setIsConfirmationSent(true);
                toast({
                    title: 'Success',
                    description: 'Please check your email for the confirmation link.',
                });
                await new Promise((resolve) => setTimeout(resolve, 4000));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Unexpected error during sign-up:', error);
            setErrorMessage('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            })
            if (error) throw error
            toast({
                title: t(currentLanguage, 'auth.sign_up.resend_email.title'),
                description: t(currentLanguage, 'auth.sign_up.resend_email.success'),
            })
        } catch (error) {
            console.error('Error resending email:', error)
            toast({
                title: t(currentLanguage, 'auth.sign_up.resend_email.error.title'),
                description: t(currentLanguage, 'auth.sign_up.resend_email.error.description'),
                variant: "destructive",
            })
        }
    }

    return (
        <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
            <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[500px] lg:p-8'>
                <Card className='p-6 rounded-none'>
                    <div className='mb-2 flex flex-col space-y-2 text-left'>
                        <h1 className='text-2xl font-semibold tracking-tight'>
                            {t(currentLanguage, 'auth.pages.sign_up.title')}
                        </h1>
                    </div>
                    <div className='mb-4'></div>
                    <SignUpForm
                        onSubmit={handleSignUp}
                        isLoading={isLoading}
                        isConfirmationSent={isConfirmationSent}
                        onResendEmail={handleResendEmail}
                        errorMessage={errorMessage}
                    />
                    <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
                        {t(currentLanguage, 'auth.pages.sign_up.terms_text')}{' '}
                        <Link
                            href='/terms'
                            className='text-blue-600 hover:underline'
                        >
                            {t(currentLanguage, 'auth.pages.sign_up.terms_link')}
                        </Link>{' '}
                        {t(currentLanguage, 'auth.pages.sign_up.and')}{' '}
                        <Link
                            href='/privacy'
                            className='text-blue-600 hover:underline'
                        >
                            {t(currentLanguage, 'auth.pages.sign_up.privacy_link')}
                        </Link>
                        {t(currentLanguage, 'auth.pages.sign_up.period')}
                    </p>
                </Card>
            </div>
        </div>
    )
}