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
import { PinInput, PinInputField } from '@/components/auth/pin-input'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/dist/client/router'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface OtpFormProps extends HTMLAttributes<HTMLDivElement> {
  email: string;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}

const formSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
})

export function OtpForm({ className, email, errorMessage, setErrorMessage, ...props }: OtpFormProps) {
  const { currentLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.otp,
        type: 'recovery',
      })
      if (error) throw error
      toast({
        title: t(currentLanguage, 'auth.otp.success'),
        description: t(currentLanguage, 'auth.otp.success_message'),
      })
      router.push('/')
    } catch (error) {
      console.error('Error during OTP verification:', error)
      setErrorMessage(t(currentLanguage, 'auth.otp.error.default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-4'>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PinInput
                      {...field}
                      onComplete={(value) => form.setValue('otp', value)}
                      className='flex justify-between'
                    >
                      {Array.from({ length: 6 }, (_, i) => (
                        <PinInputField
                          key={i}
                          component={Input}
                          className='w-12 h-12 text-center rounded-none'
                        />
                      ))}
                    </PinInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='w-full rounded-none' disabled={isLoading}>
              {isLoading ? t(currentLanguage, 'auth.otp.processing') : t(currentLanguage, 'auth.otp.submit_button')}
            </Button>
            {errorMessage && (
              <p className="text-center text-sm mt-2 text-red-500 dark:text-red-400">{errorMessage}</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}