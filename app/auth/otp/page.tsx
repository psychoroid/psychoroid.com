'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { OtpForm } from '@/components/auth/otp-form'
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast'

export default function Otp() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Get email from localStorage
    const emailFromStorage = localStorage.getItem('userEmail')
    if (emailFromStorage) {
      setEmail(emailFromStorage)
    }
  }, [])

  const handleResendOtp = async () => {
    setIsResending(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      if (error) throw error
      toast({
        title: "Success",
        description: "A new OTP has been sent to your email.",
      })
    } catch (error) {
      console.error('Error resending OTP:', error)
      setErrorMessage('There was a problem resending the OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
          <Card className='p-6'>
            <div className='mb-2 flex flex-col space-y-2 text-center'>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Two-factor Authentication
              </h1>
              <p className='text-sm text-muted-foreground'>
                We have sent an authentication code to your email.
              </p>
            </div>
            <div className='mb-4'></div>
            <OtpForm email={email} errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
            <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
              Haven&apos;t received it?{' '}
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className='underline underline-offset-4 hover:text-primary'
              >
                {isResending ? 'Resending...' : 'Resend a new code'}
              </button>
            </p>
            {errorMessage && (
              <p className="text-center text-sm mt-2 text-red-500 dark:text-red-400">{errorMessage}</p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}