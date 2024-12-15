'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAuthForm } from '@/components/auth/user-auth-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Grid from '@/components/design/grid'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/supabase';
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

// Dynamically import LandingViewer with no SSR
const LandingViewer = dynamic(
    () => import('@/components/3D/LandingViewer').then(mod => mod.LandingViewer),
    { ssr: false }
)

export default function SignIn() {
    const router = useRouter();
    const { currentLanguage } = useTranslation();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/');
            }
        };

        checkSession();
    }, [router]);

    return (
        <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
            <div className='relative hidden h-full flex-col bg-black p-10 text-white dark:border-r lg:flex'>
                <Grid />
                <div className="absolute inset-0">
                    <LandingViewer />
                </div>

                <Link
                    href="/"
                    className="relative z-20 inline-flex items-center text-cyan-100 hover:text-cyan-200 transition-colors bg-black/50 px-4 py-2 rounded-none border border-cyan-500/30 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{t(currentLanguage, 'auth.pages.sign_in.home_link')}</span>
                </Link>

                <div className='relative z-20 mt-auto'>
                    <blockquote className='space-y-2'>
                        <p className='text-lg text-cyan-100'>
                            {t(currentLanguage, 'auth.pages.sign_in.quote')}
                        </p>
                        <div className="my-2 w-[calc(100%-12rem)] border-t border-cyan-500/30"></div>
                        <footer className='text-sm text-cyan-200'>
                            <span className="block">{t(currentLanguage, 'auth.pages.sign_in.company')}</span>
                        </footer>
                    </blockquote>
                </div>
            </div>
            <div className='lg:p-8'>
                <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px] lg:p-8'>
                    <div className='flex flex-col space-y-2 text-left'>
                        <h1 className='text-2xl font-semibold tracking-tight'>
                            {t(currentLanguage, 'auth.pages.sign_in.title')}
                        </h1>
                        <p className='text-sm text-muted-foreground'>
                            {t(currentLanguage, 'auth.pages.sign_in.subtitle')}
                        </p>
                    </div>
                    <UserAuthForm />
                </div>
            </div>
        </div>
    )
}

