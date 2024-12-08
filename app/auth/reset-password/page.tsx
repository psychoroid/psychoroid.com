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

const formSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ResetPassword() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: data.password })
            if (error) throw error
            toast({
                title: "Success",
                description: "Your password has been reset successfully.",
            })
            router.push('/portal')
        } catch (error) {
            console.error('Error resetting password:', error)
            toast({
                title: "Error",
                description: "There was a problem resetting your password. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
            <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
                <Card className='p-6'>
                    <h1 className='text-2xl font-semibold tracking-tight mb-4'>Reset Your Password</h1>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='grid gap-4'>
                            <div className='grid gap-2'>
                                <Label htmlFor='password'>New Password</Label>
                                <Input
                                    id='password'
                                    type='password'
                                    {...register('password')}
                                    className='h-12 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500'
                                />
                                {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                                <Input
                                    id='confirmPassword'
                                    type='password'
                                    {...register('confirmPassword')}
                                    className='h-12 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500'
                                />
                                {errors.confirmPassword && <p className='text-red-500 text-sm'>{errors.confirmPassword.message}</p>}
                            </div>
                            <Button type='submit' className='w-full' disabled={isLoading}>
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}