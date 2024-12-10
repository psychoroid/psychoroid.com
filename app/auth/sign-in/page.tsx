'use client'

import { UserAuthForm } from '@/components/auth/user-auth-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Grid from '@/components/design/grid'

export default function SignIn() {
    return (
        <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
            <div className='relative hidden h-full flex-col bg-black p-10 text-white dark:border-r lg:flex'>
                <Grid />
                <Link
                    href="/"
                    className="relative z-20 w-1/6 flex items-center text-cyan-100 hover:text-cyan-200 transition-colors bg-black/50 px-4 py-2 rounded-none border border-cyan-500/30"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="text-lg font-medium">Home</span>
                </Link>
                <div className='relative z-20 mt-auto'>
                    <blockquote className='space-y-2'>
                        <p className='text-lg text-cyan-100'>
                            &ldquo;We&apos;re just getting started.&rdquo;
                        </p>
                        <footer className='text-sm text-cyan-200'>Founder</footer>
                    </blockquote>
                </div>
            </div>
            <div className='lg:p-8'>
                <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px] lg:p-8'>
                    <div className='flex flex-col space-y-2 text-left'>
                        <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
                        <p className='text-sm text-muted-foreground'>
                            Enter your email below to sign in to your account.
                        </p>
                    </div>
                    <UserAuthForm />
                </div>
            </div>
        </div>
    )
}

