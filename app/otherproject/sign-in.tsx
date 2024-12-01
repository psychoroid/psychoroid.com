import { UserAuthForm } from '@/components/auth/user-auth-form'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AnimatedBeamMultipleOutputDemo } from '@/components/landing/AnimatedBeamMultipleOutputs'

export default function SignIn() {
  return (
    <>
      <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
        <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
          <div className='absolute inset-0 bg-black' />
          <Link
            to="/"
            className="relative z-20 w-1/6 flex items-center text-sage-100 hover:text-sage-200 transition-colors bg-black px-4 py-2 rounded-md border border-transparent"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">Home</span>
          </Link>
          <div className='relative z-20 flex items-center justify-center flex-grow'>
            <AnimatedBeamMultipleOutputDemo />
          </div>
          <div className='relative z-20 mt-auto'>
            <blockquote className='space-y-2'>
              <p className='text-lg text-sage-100'>
                &ldquo;We&apos;re just getting started.&rdquo;
              </p>
              <footer className='text-sm text-sage-200'>Founder</footer>
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
    </>
  )
}