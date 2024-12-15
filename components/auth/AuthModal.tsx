'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { currentLanguage } = useTranslation();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 rounded-none border-0 sm:max-w-[425px] [&>button]:hidden">
                <VisuallyHidden asChild>
                    <DialogTitle>{t(currentLanguage, 'auth.modal.title')}</DialogTitle>
                </VisuallyHidden>
                <VisuallyHidden asChild>
                    <DialogDescription>
                        {t(currentLanguage, 'auth.modal.description')}
                    </DialogDescription>
                </VisuallyHidden>
                <div className="px-8 py-6">
                    <div className="flex flex-col space-y-2 text-left mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t(currentLanguage, 'auth.sign_in.title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t(currentLanguage, 'auth.sign_in.subtitle')}
                        </p>
                    </div>
                    <UserAuthForm />
                </div>
            </DialogContent>
        </Dialog>
    );
} 