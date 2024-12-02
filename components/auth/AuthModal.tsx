'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { UserAuthForm } from "./user-auth-form"

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="px-4">
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-left">
                        Welcome back
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        Please sign in to use the 3D Engine
                    </DialogDescription>
                </DialogHeader>
                <UserAuthForm className="px-4" />
            </DialogContent>
        </Dialog>
    )
} 