import { HTMLAttributes, useState } from 'react'
import { cn } from '@/lib/actions/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from '@/lib/hooks/use-toast'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface ForgotFormProps extends HTMLAttributes<HTMLDivElement> {
  onSuccess: (email: string) => void;
}

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
})

export function ForgotForm({ className, onSuccess, ...props }: ForgotFormProps) {
  const { currentLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      toast({
        title: t(currentLanguage, 'auth.forgot_password.success'),
        description: t(currentLanguage, 'auth.forgot_password.success_message'),
      })
      onSuccess(data.email)
    } catch (error) {
      console.error('Error during password reset:', error)
      toast({
        title: t(currentLanguage, 'auth.forgot_password.error'),
        description: t(currentLanguage, 'auth.forgot_password.error'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder={t(currentLanguage, 'auth.forgot_password.email_placeholder')}
                      {...field}
                      className='h-12 border border-gray-300 rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className='w-full h-12 mt-2 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500'
              disabled={isLoading}
            >
              {isLoading ? t(currentLanguage, 'auth.forgot_password.sending') : t(currentLanguage, 'auth.forgot_password.submit_button')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}