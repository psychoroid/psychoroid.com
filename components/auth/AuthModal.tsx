'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 rounded-none border-0 sm:max-w-[425px] [&>button]:hidden">
                <VisuallyHidden asChild>
                    <DialogTitle>Sign in to psychoroid.com</DialogTitle>
                </VisuallyHidden>
                <VisuallyHidden asChild>
                    <DialogDescription>
                        Sign in to continue to psychoroid.com and access your account
                    </DialogDescription>
                </VisuallyHidden>
                <div className="px-8 py-6">
                    <div className="flex flex-col space-y-2 text-left mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to explore psychoroid.com
                        </p>
                    </div>
                    <UserAuthForm />
                </div>
            </DialogContent>
        </Dialog>
    );
} 