'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/supabase';
import { toast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/actions/utils'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

export default function ResetPassword() {
    const { currentLanguage } = useTranslation();
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const formSchema = z.object({
        password: z.string().min(8, {
            message: t(currentLanguage, 'auth.pages.reset_password.validation.min_length')
        }),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t(currentLanguage, 'auth.pages.reset_password.validation.match'),
        path: ["confirmPassword"],
    })

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            })

            if (error) throw error

            toast({
                title: t(currentLanguage, 'auth.pages.reset_password.success.title'),
                description: t(currentLanguage, 'auth.pages.reset_password.success.description'),
            })

            router.push('/auth/sign-in')
        } catch (error) {
            console.error('Error resetting password:', error)
            toast({
                title: t(currentLanguage, 'auth.pages.reset_password.error.title'),
                description: t(currentLanguage, 'auth.pages.reset_password.error.description'),
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
            <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
                <Card className='p-6 rounded-none'>
                    <div className='mb-2 flex flex-col space-y-2 text-left'>
                        <h1 className='text-2xl font-semibold tracking-tight'>
                            {t(currentLanguage, 'auth.pages.reset_password.title')}
                        </h1>
                    </div>
                    <div className='mb-4'></div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='grid gap-4'>
                            <div className='grid gap-2'>
                                <Label className='sr-only' htmlFor='password'>
                                    {t(currentLanguage, 'auth.pages.reset_password.new_password')}
                                </Label>
                                <Input
                                    id='password'
                                    placeholder={t(currentLanguage, 'auth.pages.reset_password.placeholder.new')}
                                    type='password'
                                    {...register('password')}
                                    className={cn(
                                        'h-12 border border-gray-300 rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600',
                                        {
                                            'border-red-500': errors.password,
                                            'border-gray-300 dark:border-gray-600': !errors.password,
                                        }
                                    )}
                                />
                                {errors.password && (
                                    <p className='text-red-500 text-sm'>{errors.password.message}</p>
                                )}
                            </div>
                            <div className='grid gap-2'>
                                <Label className='sr-only' htmlFor='confirmPassword'>
                                    {t(currentLanguage, 'auth.pages.reset_password.confirm_password')}
                                </Label>
                                <Input
                                    id='confirmPassword'
                                    placeholder={t(currentLanguage, 'auth.pages.reset_password.placeholder.confirm')}
                                    type='password'
                                    {...register('confirmPassword')}
                                    className={cn(
                                        'h-12 border border-gray-300 rounded-none focus:border-blue-500 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600',
                                        {
                                            'border-red-500': errors.confirmPassword,
                                            'border-gray-300 dark:border-gray-600': !errors.confirmPassword,
                                        }
                                    )}
                                />
                                {errors.confirmPassword && (
                                    <p className='text-red-500 text-sm'>{errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <Button
                                type='submit'
                                className='w-full h-12 rounded-none bg-white text-black hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:bg-gray-600 dark:active:bg-gray-500'
                                disabled={isLoading}
                            >
                                {isLoading ?
                                    t(currentLanguage, 'auth.pages.reset_password.button.processing') :
                                    t(currentLanguage, 'auth.pages.reset_password.button.submit')
                                }
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}