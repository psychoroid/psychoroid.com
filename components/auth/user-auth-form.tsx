import { HTMLAttributes, useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { IconBrandGithub } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { cn } from '@/lib/actions/utils'
import { supabase } from '@/lib/supabase/supabase';
import { toast } from '@/lib/hooks/use-toast'
import { AlertCircle } from "lucide-react"
import Spinner from '@/components/ui/spinner'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { currentLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isValidPassword, setIsValidPassword] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setIsValidEmail(formSchema.shape.email.safeParse(e.target.value).success)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setIsValidPassword(formSchema.shape.password.safeParse(e.target.value).success)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isValidEmail && isValidPassword) {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          let message = 'An error occurred while signing in. Please try again.'
          if (error.message.includes('Invalid login credentials')) {
            message = "Invalid email or password. Please try again or sign up if you don't have an account."
          } else if (error.message.includes('Email not confirmed')) {
            message = "Please confirm your email address before signing in."
          }
          setErrorMessage(message)
        } else if (signInData.user) {
          toast({
            title: "Success",
            description: "You have successfully signed in.",
          })

          // Redirect to home page
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error during sign in:', error)
        setErrorMessage('An unexpected error occurred. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      if (provider === 'google') setIsGoogleLoading(true)
      if (provider === 'github') setIsGithubLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
          queryParams: {
            ...(provider === 'google' ? {
              access_type: 'offline',
              prompt: 'consent'
            } : {})
          },
        },
      })

      if (error) throw error
      if (!data.url) throw new Error('No URL returned from Supabase')

      window.location.href = data.url
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setErrorMessage(`There was a problem signing in with ${provider}. Please try again.`)
      if (provider === 'google') setIsGoogleLoading(false)
      if (provider === 'github') setIsGithubLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className='grid gap-2'>
          <Input
            id="email"
            type="email"
            placeholder={t(currentLanguage, 'auth.sign_in.email_placeholder')}
            value={email}
            onChange={handleEmailChange}
            className={cn(
              'h-12 border rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white',
              {
                'border-gray-300 dark:border-gray-600': !isValidEmail && email === '',
                'border-red-500 dark:border-red-500': !isValidEmail && email !== '',
                'border-green-500 dark:border-green-500': isValidEmail,
              }
            )}
            autoComplete="username"
          />
          <div className='flex justify-end mb-1'>
            <Link
              href='/forgot-password'
              className='text-sm font-medium text-blue-600 hover:text-blue-600 whitespace-nowrap'
            >
              {t(currentLanguage, 'auth.sign_in.forgot_password')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder={t(currentLanguage, 'auth.sign_in.password_placeholder')}
            value={password}
            onChange={handlePasswordChange}
            className={cn(
              'h-12 border rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white',
              {
                'border-gray-300 dark:border-gray-600': !isValidPassword && password === '',
                'border-red-500 dark:border-red-500': !isValidPassword && password !== '',
                'border-green-500 dark:border-green-500': isValidPassword,
              }
            )}
            autoComplete="current-password"
          />
          {errorMessage && (
            <div className="flex items-center gap-2 bg-red-50 text-red-900 px-4 py-3 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}
          <Button
            className='w-full h-12 rounded-none'
            type='submit'
            disabled={isLoading || !isValidEmail || !isValidPassword}
          >
            {isLoading ? (
              <span className="text-sm">{t(currentLanguage, 'auth.sign_in.processing')}</span>
            ) : (
              <span className="text-base font-semibold">{t(currentLanguage, 'auth.sign_in.connect_button')}</span>
            )}
          </Button>
        </div>
      </form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t border-gray-300 dark:border-gray-600' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-gray-500'>
            {t(currentLanguage, 'auth.sign_in.or_continue')}
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <Button
          className="w-full h-12 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isGoogleLoading || isGithubLoading || isMicrosoftLoading}
        >
          <div className="flex items-center justify-center">
            {isGoogleLoading ? (
              <Spinner size={20} color="#E5E7EB" />
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>&nbsp;{t(currentLanguage, 'auth.sign_in.google')}</span>
          </div>
        </Button>

        <Button
          className='w-full h-12 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500'
          type='button'
          disabled={isGoogleLoading || isGithubLoading || isMicrosoftLoading}
          onClick={() => handleOAuthSignIn('github')}
        >
          <div className="flex items-center justify-center">
            {isGithubLoading ? (
              <Spinner size={20} color="#E5E7EB" />
            ) : (
              <IconBrandGithub className='h-6 w-6 mr-2' />
            )}
            <span>&nbsp;{t(currentLanguage, 'auth.sign_in.github')}</span>
          </div>
        </Button>

        <p className='px-8 text-center text-sm text-muted-foreground'>
          {t(currentLanguage, 'auth.sign_in.no_account')}{' '}
          <Link
            href='/sign-up'
            className='underline underline-offset-4 text-blue-600 hover:text-blue-600'
          >
            {t(currentLanguage, 'auth.sign_in.sign_up_link')}
          </Link>
        </p>
      </div>
    </div>
  )
}
