'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ForgotForm } from '@/components/auth/forgot-form'
import { CheckEmailMessage } from '@/components/auth/check-email-message'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase';
import { toast } from '@/components/ui/use-toast'

export default function ForgotPassword() {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      toast({
        title: "Success",
        description: "Password reset email resent. Please check your inbox.",
      })
    } catch (error) {
      console.error('Error resending password reset email:', error)
      toast({
        title: "Error",
        description: "There was a problem resending the email. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
        <Card className='p-6 rounded-none'>
          {isEmailSent ? (
            <CheckEmailMessage email={email} onResendEmail={handleResendEmail} />
          ) : (
            <>
              <div className='mb-2 flex flex-col space-y-2 text-left'>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  Reset your password
                </h1>
              </div>
              <div className='mb-4'></div>
              <ForgotForm onSuccess={(submittedEmail) => {
                setEmail(submittedEmail)
                setIsEmailSent(true)
              }} />
              <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/sign-up'
                  className='underline underline-offset-4 hover:text-primary'
                >
                  Sign up
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}