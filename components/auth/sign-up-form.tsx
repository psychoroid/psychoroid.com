import { useState } from 'react'
import { IconBrandGithub } from '@tabler/icons-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/actions/utils'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { supabase } from '@/lib/supabase/supabase';
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface SignUpFormProps {
  className?: string
  onSubmit: (data: { email: string; password: string; fullName: string }) => Promise<void>
  isLoading: boolean
  isConfirmationSent: boolean
  onResendEmail: () => Promise<void>
  errorMessage: string
}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().regex(/^[A-Za-z']+ [A-Za-z']+/, 'Please enter both first and last name'),
})

export function SignUpForm({ className, onSubmit, isLoading, isConfirmationSent, onResendEmail, errorMessage, ...props }: SignUpFormProps) {
  const { currentLanguage } = useTranslation();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isValidPassword, setIsValidPassword] = useState(false)
  const [isValidFullName, setIsValidFullName] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setIsValidEmail(formSchema.shape.email.safeParse(e.target.value).success)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setIsValidPassword(formSchema.shape.password.safeParse(e.target.value).success)
  }

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)
    setIsValidFullName(formSchema.shape.fullName.safeParse(e.target.value).success)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isValidEmail && isValidPassword && isValidFullName) {
      await onSubmit({ email, password, fullName })
    }
  }

  const handleOAuthSignUp = async (provider: 'github' | 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email',
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No URL returned from Supabase');
      window.location.href = data.url;
    } catch (error) {
      console.error(`Error signing up with ${provider}:`, error);
    }
  }

  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      await onResendEmail()
    } finally {
      setIsResending(false)
    }
  }

  if (isConfirmationSent) {
    const message = t(currentLanguage, 'auth.check_email.message').replace(
      '<email>',
      `<span class="font-bold text-primary">${email}</span>`
    );

    return (
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 hover:scale-105">
        <h2 className="text-2xl font-semibold mb-4">{t(currentLanguage, 'auth.check_email.title')}</h2>
        <p
          className="mb-4"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <p className="text-sm text-muted-foreground">
          {t(currentLanguage, 'auth.check_email.resend')}{' '}
          <button
            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? t(currentLanguage, 'auth.sign_up.processing') : t(currentLanguage, 'auth.check_email.resend_link')}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className='grid gap-4'>
          <Input
            id="fullName"
            type="text"
            placeholder={t(currentLanguage, 'auth.sign_up.full_name_placeholder')}
            value={fullName}
            onChange={handleFullNameChange}
            autoComplete="name"
            className={cn(
              'h-12 border rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white',
              {
                'border-gray-300 dark:border-gray-600': !isValidFullName && fullName === '',
                'border-red-500 dark:border-red-500': !isValidFullName && fullName !== '',
                'border-green-500 dark:border-green-500': isValidFullName,
              }
            )}
          />
          <Input
            id="email"
            type="email"
            placeholder={t(currentLanguage, 'auth.sign_up.email_placeholder')}
            value={email}
            onChange={handleEmailChange}
            autoComplete="username"
            className={cn(
              'h-12 border rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white',
              {
                'border-gray-300 dark:border-gray-600': !isValidEmail && email === '',
                'border-red-500 dark:border-red-500': !isValidEmail && email !== '',
                'border-green-500 dark:border-green-500': isValidEmail,
              }
            )}
          />
          <PasswordInput
            id="password"
            placeholder={t(currentLanguage, 'auth.sign_up.password_placeholder')}
            value={password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            className={cn(
              'h-12 border rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white',
              {
                'border-gray-300 dark:border-gray-600': !isValidPassword && password === '',
                'border-red-500 dark:border-red-500': !isValidPassword && password !== '',
                'border-green-500 dark:border-green-500': isValidPassword,
              }
            )}
          />
          <Button
            className="w-full h-12 rounded-none"
            type="submit"
            disabled={isLoading || !isValidEmail || !isValidPassword || !isValidFullName}
          >
            <span className="text-base font-semibold">
              {isLoading ? t(currentLanguage, 'auth.sign_up.processing') : t(currentLanguage, 'auth.sign_up.submit_button')}
            </span>
          </Button>
          {errorMessage && (
            <p className="text-center text-sm mt-2 text-red-500 dark:text-red-400">{errorMessage}</p>
          )}
        </div>
      </form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t border-gray-300 dark:border-gray-600' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-gray-500'>
            {t(currentLanguage, 'auth.sign_up.continue_with')}
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <Button
          className="w-full h-12 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500"
          onClick={() => handleOAuthSignUp('google')}
        >
          <div className="flex items-center justify-center">
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
            <span>&nbsp;Google</span>
          </div>
        </Button>
        <Button
          className='w-full h-12 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500'
          type='button'
          disabled={isLoading}
          onClick={() => handleOAuthSignUp('github')}
        >
          <div className="flex items-center justify-center">
            <IconBrandGithub className='h-6 w-6 mr-2' />
            <span>&nbsp;GitHub</span>
          </div>
        </Button>
      </div>
    </div>
  )
}