'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SignUpForm } from '@/components/SignUpForm';

export default function SignUp() {
    const router = useRouter();

    const handleSignUp = () => {
        router.push('/');
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create a new account
                    </h2>
                    <SignUpForm onSignUp={handleSignUp} />
                </div>
            </div>
        </>
    );
} 