import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { supabase } from '@/utils/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Link } from 'react-router-dom'

export default function SignUp() {
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
          emailRedirectTo: `${window.location.origin}/onboarding`,
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
        title: "Email Resent",
        description: "A new verification email has been sent to your inbox.",
      })
    } catch (error) {
      console.error('Error resending email:', error)
      toast({
        title: "Error",
        description: "There was a problem resending the verification email. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[500px] lg:p-8'>
        <Card className='p-6'>
          <div className='mb-2 flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Create an account
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
            By creating an account, you agree to our{' '}
            <Link
              to='/terms'
              className='text-blue-600 hover:underline'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to='/privacy'
              className='text-blue-600 hover:underline'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  )
}