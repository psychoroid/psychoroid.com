'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { UserAuthForm } from '@/components/UserAuthForm';

export default function SignIn() {
    const router = useRouter();

    const handleSignIn = () => {
        router.push('/');
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <UserAuthForm onSignIn={handleSignIn} />
                </div>
            </div>
        </>
    );
} 