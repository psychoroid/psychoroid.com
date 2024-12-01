interface CheckEmailMessageProps {
    email: string;
    onResendEmail: () => void;
}

export function CheckEmailMessage({ email, onResendEmail }: CheckEmailMessageProps) {
    return (
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 hover:scale-105">
            <h2 className="text-2xl font-semibold mb-4">Check your email</h2>
            <p className="mb-4">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
            </p>
            <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                    className="text-primary hover:underline"
                    onClick={onResendEmail}
                >
                    resend the email
                </button>
            </p>
        </div>
    );
}